//! Motor de ejecución multitenant.
//!
//! - `analysis`: inspección léxica del SQL (sin falsos positivos por strings/comentarios)
//! - `connect`: Config de tokio-postgres, TLS y timeouts
//! - `runner`: ejecución en un tenant (transacción, tracking, cancelación)
//! - `history`: historial local en SQLite
//!
//! Este módulo coordina la ejecución en todos los tenants, incluido el modo
//! "todo o nada" en dos fases.

pub mod analysis;
pub mod connect;
pub mod history;
pub mod runner;
pub mod types;

#[cfg(test)]
mod integration_tests;

use futures::stream::{self, StreamExt};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::{mpsc, watch, Semaphore};
use tokio_util::sync::CancellationToken;

use crate::db::AppDb;
use runner::{Ctx, Decision, PrepareSignal};
use types::{ConnectionSpec, ExecutionMode, ExecutionOptions, PhaseEvent, TenantResult, TenantStatus};

pub const PROGRESS_EVENT: &str = "sql-execution-progress";
pub const PHASE_EVENT: &str = "sql-execution-phase";

/// Ejecuciones en curso, para poder cancelarlas.
#[derive(Default)]
pub struct ExecutionRegistry(Mutex<HashMap<String, CancellationToken>>);

impl ExecutionRegistry {
    fn insert(&self, id: &str, token: CancellationToken) {
        if let Ok(mut map) = self.0.lock() {
            map.insert(id.to_string(), token);
        }
    }
    fn remove(&self, id: &str) {
        if let Ok(mut map) = self.0.lock() {
            map.remove(id);
        }
    }
    fn cancel(&self, id: &str) -> bool {
        match self.0.lock() {
            Ok(map) => map.get(id).map(|t| t.cancel()).is_some(),
            Err(_) => false,
        }
    }
}

fn emit_phase(app: &AppHandle, execution_id: &str, phase: &'static str) {
    let _ = app.emit(
        PHASE_EVENT,
        PhaseEvent {
            execution_id: execution_id.to_string(),
            phase,
        },
    );
}

/// Agrupa resultados cada 120 ms o cada 10 elementos para no saturar el IPC
/// ni los re-renders de React.
fn spawn_progress_emitter(app: AppHandle, mut rx: mpsc::Receiver<TenantResult>) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let mut batch: Vec<TenantResult> = Vec::with_capacity(12);
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(120));
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

        loop {
            tokio::select! {
                res = rx.recv() => match res {
                    Some(item) => {
                        batch.push(item);
                        if batch.len() >= 10 {
                            let _ = app.emit(PROGRESS_EVENT, std::mem::take(&mut batch));
                        }
                    }
                    None => {
                        if !batch.is_empty() {
                            let _ = app.emit(PROGRESS_EVENT, &batch);
                        }
                        break;
                    }
                },
                _ = interval.tick() => {
                    if !batch.is_empty() {
                        let _ = app.emit(PROGRESS_EVENT, std::mem::take(&mut batch));
                    }
                }
            }
        }
    })
}

fn current_user() -> String {
    std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_else(|_| "unknown".into())
}

#[tauri::command]
pub async fn execute_sql(
    app: AppHandle,
    registry: State<'_, ExecutionRegistry>,
    db: State<'_, AppDb>,
    sql: String,
    connections: Vec<ConnectionSpec>,
    options: ExecutionOptions,
) -> Result<Vec<TenantResult>, String> {
    let analysis = analysis::analyze(&sql);
    if analysis.statement_count == 0 {
        return Err("El script está vacío".into());
    }
    if options.mode != ExecutionMode::Independent {
        if analysis.non_transactional {
            return Err("El script contiene sentencias que Postgres no permite dentro de una transacción (CONCURRENTLY, VACUUM, CREATE DATABASE...). Usa el modo Independiente.".into());
        }
        if analysis.controls_transaction {
            return Err("El script contiene BEGIN/COMMIT/ROLLBACK propios. Quítalos para usar este modo (Tenant Forge maneja la transacción) o usa el modo Independiente.".into());
        }
    }

    let execution_id = options.execution_id.clone();
    let started_at = chrono::Utc::now().to_rfc3339();
    let script_hash = analysis::script_hash(&sql);

    let cancel = CancellationToken::new();
    registry.insert(&execution_id, cancel.clone());
    emit_phase(&app, &execution_id, "running");

    let (progress_tx, progress_rx) = mpsc::channel::<TenantResult>(64);
    let emitter = spawn_progress_emitter(app.clone(), progress_rx);

    let phase_app = app.clone();
    let phase_id = execution_id.clone();
    let results = run_all(
        &sql,
        options.clone(),
        analysis,
        cancel,
        app.package_info().version.to_string(),
        connections,
        progress_tx,
        move |phase| emit_phase(&phase_app, &phase_id, phase),
    )
    .await;

    let _ = emitter.await;
    registry.remove(&execution_id);

    let finished_at = chrono::Utc::now().to_rfc3339();
    match db.conn() {
        Ok(mut conn) => {
            if let Err(e) = history::save(&mut conn, &options, &script_hash, &sql, &started_at, &finished_at, &results) {
                eprintln!("[execution] no se pudo guardar el historial: {}", e);
            }
        }
        Err(e) => eprintln!("[execution] {}", e),
    }

    emit_phase(&app, &execution_id, "done");
    Ok(results)
}

/// Ejecuta el script en todos los tenants. Independiente de Tauri para poder
/// probarlo: los resultados parciales salen por `progress` y las fases por `on_phase`.
#[allow(clippy::too_many_arguments)]
pub async fn run_all(
    sql: &str,
    options: ExecutionOptions,
    analysis: analysis::SqlAnalysis,
    cancel: CancellationToken,
    app_version: String,
    connections: Vec<ConnectionSpec>,
    progress: mpsc::Sender<TenantResult>,
    on_phase: impl Fn(&'static str) + Send + 'static,
) -> Vec<TenantResult> {
    let mode = options.mode;
    let total = connections.len();

    let (decision_tx, decision_rx) = watch::channel::<Option<Decision>>(None);
    let ctx = Arc::new(Ctx {
        sql: sql.to_string(),
        semaphore: Arc::new(Semaphore::new(options.concurrency())),
        script_hash: analysis::script_hash(sql),
        opts: options,
        analysis,
        cancel: cancel.clone(),
        decision: decision_rx,
        app_version,
        applied_by: current_user(),
    });

    // Coordinador de dos fases (solo todo o nada)
    let (prepare_tx, mut prepare_rx) = mpsc::unbounded_channel::<bool>();
    let coordinator = (mode == ExecutionMode::AllOrNothing).then(|| {
        let cancel = cancel.clone();
        tokio::spawn(async move {
            let mut received = 0usize;
            let mut all_ok = true;
            while received < total {
                tokio::select! {
                    msg = prepare_rx.recv() => match msg {
                        Some(ok) => {
                            received += 1;
                            if !ok {
                                // Basta un fallo: revertir ya, sin esperar al resto.
                                all_ok = false;
                                break;
                            }
                        }
                        None => break,
                    },
                    _ = cancel.cancelled() => {
                        all_ok = false;
                        break;
                    }
                }
            }
            let decision = if all_ok && received == total { Decision::Commit } else { Decision::Rollback };
            on_phase(if decision == Decision::Commit { "committing" } else { "rolling_back" });
            let _ = decision_tx.send(Some(decision));
        })
    });

    let ids: Vec<String> = connections.iter().map(|c| c.id.clone()).collect();
    let handles: Vec<_> = connections
        .into_iter()
        .map(|spec| {
            let ctx = Arc::clone(&ctx);
            let progress = progress.clone();
            let signal = PrepareSignal::new((mode == ExecutionMode::AllOrNothing).then(|| prepare_tx.clone()));
            tokio::spawn(async move {
                let result = runner::run_tenant(spec, ctx, signal).await;
                let _ = progress.send(result.clone()).await;
                result
            })
        })
        .collect();
    drop(prepare_tx);
    drop(progress);

    let results = futures::future::join_all(handles)
        .await
        .into_iter()
        .zip(ids)
        .map(|(res, id)| {
            res.unwrap_or_else(|e| TenantResult {
                connection_id: id,
                success: false,
                message: format!("Error interno ejecutando el tenant: {}", e),
                status: TenantStatus::Failed,
                duration_ms: 0,
                rows_affected: None,
                result_sets: vec![],
            })
        })
        .collect();

    if let Some(c) = coordinator {
        let _ = c.await;
    }
    results
}

#[tauri::command]
pub fn cancel_execution(registry: State<'_, ExecutionRegistry>, execution_id: String) -> bool {
    registry.cancel(&execution_id)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationStatus {
    pub connection_id: String,
    /// applied | pending | error
    pub state: &'static str,
    pub applied_at: Option<String>,
    pub message: Option<String>,
}

/// Indica en qué tenants ya está aplicado el script.
#[tauri::command]
pub async fn get_migration_status(
    sql: String,
    connections: Vec<ConnectionSpec>,
) -> Result<Vec<MigrationStatus>, String> {
    let hash = analysis::script_hash(&sql);
    let never = CancellationToken::new();

    let statuses = stream::iter(connections)
        .map(|spec| {
            let hash = hash.clone();
            let never = never.clone();
            async move {
                let error = |message: String| MigrationStatus {
                    connection_id: spec.id.clone(),
                    state: "error",
                    applied_at: None,
                    message: Some(message),
                };
                let client = match connect::connect(&spec, &never).await {
                    Ok((client, _)) => client,
                    Err(connect::ConnectError::Failed(e)) => return error(e),
                    Err(connect::ConnectError::Cancelled) => return error("Cancelado".into()),
                };
                if let Err(e) = runner::set_search_path(&client, &spec).await {
                    return error(e);
                }
                match runner::applied_at(&client, &runner::tracking_table(&spec), &hash).await {
                    Ok(Some(at)) => MigrationStatus {
                        connection_id: spec.id.clone(),
                        state: "applied",
                        applied_at: Some(at),
                        message: None,
                    },
                    Ok(None) => MigrationStatus {
                        connection_id: spec.id.clone(),
                        state: "pending",
                        applied_at: None,
                        message: None,
                    },
                    Err(e) => error(e),
                }
            }
        })
        .buffer_unordered(12)
        .collect::<Vec<_>>()
        .await;

    Ok(statuses)
}
