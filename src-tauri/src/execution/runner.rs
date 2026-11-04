//! Ejecución del script en un tenant.

use postgres_native_tls::MakeTlsConnector;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::{mpsc, watch, Semaphore};
use tokio_postgres::{CancelToken, Client, SimpleQueryMessage};
use tokio_util::sync::CancellationToken;

use super::analysis::SqlAnalysis;
use super::connect::{self, ConnectError};
use super::types::{ConnectionSpec, ExecutionMode, ExecutionOptions, ResultSet, TenantResult, TenantStatus};

pub const TRACKING_TABLE: &str = "_tenant_forge_migrations";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    Commit,
    Rollback,
}

/// Contexto compartido por todos los tenants de una ejecución.
pub struct Ctx {
    pub sql: String,
    pub opts: ExecutionOptions,
    pub analysis: SqlAnalysis,
    pub script_hash: String,
    pub cancel: CancellationToken,
    pub semaphore: Arc<Semaphore>,
    pub decision: watch::Receiver<Option<Decision>>,
    pub app_version: String,
    pub applied_by: String,
}

impl Ctx {
    /// El registro de migraciones se desactiva para scripts de solo lectura y en dry-run.
    fn tracking(&self) -> bool {
        self.opts.track_migration && !self.analysis.read_only
    }
}

/// Señal de "preparado" para el modo todo-o-nada. Se envía exactamente una
/// vez: si el tenant termina sin enviarla (error, panic), el Drop envía `false`.
pub struct PrepareSignal(Option<mpsc::UnboundedSender<bool>>);

impl PrepareSignal {
    pub fn new(tx: Option<mpsc::UnboundedSender<bool>>) -> Self {
        PrepareSignal(tx)
    }
    fn send(&mut self, ok: bool) {
        if let Some(tx) = self.0.take() {
            let _ = tx.send(ok);
        }
    }
}

impl Drop for PrepareSignal {
    fn drop(&mut self) {
        self.send(false);
    }
}

enum QueryError {
    Cancelled,
    Failed(String),
}

pub fn quote_ident(ident: &str) -> String {
    format!("\"{}\"", ident.replace('"', "\"\""))
}

/// Schema donde vive la tabla de control: el primero del search_path del
/// tenant (para soportar tenants por schema dentro de una misma BD).
pub fn tracking_table(spec: &ConnectionSpec) -> String {
    let schema = spec
        .schema
        .as_deref()
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().trim_matches('"'))
        .filter(|s| !s.is_empty() && !s.starts_with('$'))
        .unwrap_or("public");
    format!("{}.{}", quote_ident(schema), TRACKING_TABLE)
}

pub fn format_db_error(e: &tokio_postgres::Error) -> String {
    match e.as_db_error() {
        Some(db) => {
            let mut msg = format!("{} (Código: {})", db.message(), db.code().code());
            if let Some(detail) = db.detail() {
                msg.push_str(&format!("\nDetalle: {}", detail));
            }
            if let Some(hint) = db.hint() {
                msg.push_str(&format!("\nSugerencia: {}", hint));
            }
            if db.code().code() == "57014" {
                msg.push_str("\n(La sentencia superó el statement_timeout configurado)");
            }
            msg
        }
        None => e.to_string(),
    }
}

pub async fn set_search_path(client: &Client, spec: &ConnectionSpec) -> Result<(), String> {
    if let Some(schema) = spec.schema.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        client
            .query_one("SELECT set_config('search_path', $1, false)", &[&schema])
            .await
            .map_err(|e| format!("Error estableciendo schema '{}': {}", schema, format_db_error(&e)))?;
    }
    Ok(())
}

/// Devuelve la fecha en que el script se aplicó en este tenant, si consta.
pub async fn applied_at(client: &Client, table: &str, hash: &str) -> Result<Option<String>, String> {
    let exists: bool = client
        .query_one("SELECT to_regclass($1) IS NOT NULL", &[&table])
        .await
        .map_err(|e| format_db_error(&e))?
        .get(0);
    if !exists {
        return Ok(None);
    }
    let row = client
        .query_opt(
            &format!(
                "SELECT to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS TZ') FROM {} WHERE script_hash = $1 ORDER BY applied_at DESC LIMIT 1",
                table
            ),
            &[&hash],
        )
        .await
        .map_err(|e| format_db_error(&e))?;
    Ok(row.map(|r| r.get(0)))
}

async fn ensure_tracking_table(client: &Client, table: &str) -> Result<(), String> {
    let ddl = format!(
        "CREATE TABLE IF NOT EXISTS {t} (
            id bigserial PRIMARY KEY,
            script_hash text NOT NULL,
            script_name text,
            applied_at timestamptz NOT NULL DEFAULT now(),
            applied_by text,
            app_version text,
            duration_ms integer
        );
        CREATE INDEX IF NOT EXISTS {idx} ON {t} (script_hash);",
        t = table,
        idx = quote_ident(&format!("{}_hash_idx", TRACKING_TABLE)),
    );
    // Dos tenants en la misma BD pueden competir al crearla: un reintento basta.
    match client.batch_execute(&ddl).await {
        Ok(()) => Ok(()),
        Err(_) => client.batch_execute(&ddl).await.map_err(|e| {
            format!(
                "No se pudo crear la tabla de control {}: {}. Desactiva \"Registrar como migración\" si el usuario no tiene permisos de CREATE",
                table,
                format_db_error(&e)
            )
        }),
    }
}

async fn record_migration(client: &Client, table: &str, ctx: &Ctx, duration_ms: u64) -> Result<(), String> {
    let duration = i32::try_from(duration_ms).unwrap_or(i32::MAX);
    client
        .execute(
            &format!(
                "INSERT INTO {} (script_hash, script_name, applied_by, app_version, duration_ms) VALUES ($1, $2, $3, $4, $5)",
                table
            ),
            &[&ctx.script_hash, &ctx.opts.script_name, &ctx.applied_by, &ctx.app_version, &duration],
        )
        .await
        .map(|_| ())
        .map_err(|e| format!("No se pudo registrar la migración: {}", format_db_error(&e)))
}

fn collect_messages(msgs: Vec<SimpleQueryMessage>, max_rows: usize) -> (u64, Vec<ResultSet>) {
    let mut sets: Vec<ResultSet> = Vec::new();
    let mut current: Option<usize> = None;
    let mut total = 0u64;

    for msg in msgs {
        match msg {
            SimpleQueryMessage::RowDescription(cols) => {
                sets.push(ResultSet {
                    columns: cols.iter().map(|c| c.name().to_string()).collect(),
                    rows: Vec::new(),
                    truncated: false,
                });
                current = Some(sets.len() - 1);
            }
            SimpleQueryMessage::Row(row) => {
                let idx = match current {
                    Some(i) => i,
                    None => {
                        sets.push(ResultSet {
                            columns: row.columns().iter().map(|c| c.name().to_string()).collect(),
                            rows: Vec::new(),
                            truncated: false,
                        });
                        current = Some(sets.len() - 1);
                        sets.len() - 1
                    }
                };
                let set = &mut sets[idx];
                if set.rows.len() < max_rows {
                    set.rows.push((0..row.len()).map(|i| row.get(i).map(str::to_owned)).collect());
                } else {
                    set.truncated = true;
                }
            }
            SimpleQueryMessage::CommandComplete(n) => {
                total += n;
                current = None;
            }
            #[allow(unreachable_patterns)]
            _ => {}
        }
    }

    (total, sets)
}

async fn run_query(
    client: &Client,
    cancel_token: &CancelToken,
    tls: &MakeTlsConnector,
    ctx: &Ctx,
) -> Result<(u64, Vec<ResultSet>), QueryError> {
    let fut = client.simple_query(&ctx.sql);
    tokio::pin!(fut);

    let mut cancel_sent = false;
    let res = tokio::select! {
        r = &mut fut => r,
        _ = ctx.cancel.cancelled() => {
            cancel_sent = true;
            let _ = cancel_token.cancel_query(tls.clone()).await;
            fut.await
        }
    };

    match res {
        Ok(msgs) => Ok(collect_messages(msgs, ctx.opts.max_rows())),
        Err(_) if cancel_sent || ctx.cancel.is_cancelled() => Err(QueryError::Cancelled),
        Err(e) => Err(QueryError::Failed(format_db_error(&e))),
    }
}

async fn rollback(client: &Client) {
    let _ = client.batch_execute("ROLLBACK").await;
}

pub async fn run_tenant(spec: ConnectionSpec, ctx: Arc<Ctx>, mut signal: PrepareSignal) -> TenantResult {
    let start = Instant::now();
    let id = spec.id.clone();
    let done = |status: TenantStatus, message: String, rows: Option<u64>, sets: Vec<ResultSet>| TenantResult {
        connection_id: id.clone(),
        success: matches!(status, TenantStatus::Committed | TenantStatus::Skipped)
            || (status == TenantStatus::RolledBack && ctx.opts.mode == ExecutionMode::DryRun),
        message,
        status,
        duration_ms: start.elapsed().as_millis() as u64,
        rows_affected: rows,
        result_sets: sets,
    };
    let cancelled = || done(TenantStatus::Cancelled, "Ejecución cancelada".into(), None, vec![]);

    // 1. Esperar turno (límite de concurrencia)
    let permit = tokio::select! {
        p = ctx.semaphore.clone().acquire_owned() => p.ok(),
        _ = ctx.cancel.cancelled() => None,
    };
    let Some(permit) = permit else { return cancelled() };

    if let Err(e) = connect::validate_type(&spec) {
        return done(TenantStatus::Failed, e, None, vec![]);
    }

    // 2. Conectar
    let (client, tls) = match connect::connect(&spec, &ctx.cancel).await {
        Ok(c) => c,
        Err(ConnectError::Cancelled) => return cancelled(),
        Err(ConnectError::Failed(e)) => return done(TenantStatus::Failed, e, None, vec![]),
    };
    let cancel_token = client.cancel_token();

    if let Err(e) = set_search_path(&client, &spec).await {
        return done(TenantStatus::Failed, e, None, vec![]);
    }

    // 3. ¿Ya aplicado?
    let table = tracking_table(&spec);
    if ctx.tracking() && !ctx.opts.force {
        match applied_at(&client, &table, &ctx.script_hash).await {
            Ok(Some(at)) => {
                signal.send(true);
                return done(
                    TenantStatus::Skipped,
                    format!("Omitido: este script ya se aplicó el {} (usa \"Forzar\" para re-ejecutarlo)", at),
                    None,
                    vec![],
                );
            }
            Ok(None) => {}
            Err(e) => {
                return done(TenantStatus::Failed, format!("Error consultando {}: {}", table, e), None, vec![])
            }
        }
    }

    let record = ctx.tracking() && ctx.opts.mode != ExecutionMode::DryRun;
    if record {
        if let Err(e) = ensure_tracking_table(&client, &table).await {
            return done(TenantStatus::Failed, e, None, vec![]);
        }
    }

    // 4a. Scripts que no admiten transacción (solo modo independiente)
    if ctx.analysis.non_transactional || ctx.analysis.controls_transaction {
        return match run_query(&client, &cancel_token, &tls, &ctx).await {
            Err(QueryError::Cancelled) => cancelled(),
            Err(QueryError::Failed(e)) => done(TenantStatus::Failed, e, None, vec![]),
            Ok((rows, sets)) => {
                if record {
                    let elapsed = start.elapsed().as_millis() as u64;
                    if let Err(e) = record_migration(&client, &table, &ctx, elapsed).await {
                        return done(TenantStatus::Failed, format!("El script se ejecutó, pero {}", e), Some(rows), sets);
                    }
                }
                done(
                    TenantStatus::Committed,
                    format!("Ejecutado sin transacción. Filas: {}", rows),
                    Some(rows),
                    sets,
                )
            }
        };
    }

    // 4b. Ejecución transaccional
    let mut setup = String::from("BEGIN;");
    if let Some(ms) = ctx.opts.statement_timeout_ms.filter(|ms| *ms > 0) {
        setup.push_str(&format!("SET LOCAL statement_timeout = {};", ms));
    }
    if let Some(ms) = ctx.opts.lock_timeout_ms.filter(|ms| *ms > 0) {
        setup.push_str(&format!("SET LOCAL lock_timeout = {};", ms));
    }
    if let Err(e) = client.batch_execute(&setup).await {
        rollback(&client).await;
        return done(TenantStatus::Failed, format!("Error iniciando transacción: {}", format_db_error(&e)), None, vec![]);
    }

    let (rows, sets) = match run_query(&client, &cancel_token, &tls, &ctx).await {
        Ok(r) => r,
        Err(QueryError::Cancelled) => {
            rollback(&client).await;
            return cancelled();
        }
        Err(QueryError::Failed(e)) => {
            rollback(&client).await;
            return done(TenantStatus::Failed, e, None, vec![]);
        }
    };

    if record {
        let elapsed = start.elapsed().as_millis() as u64;
        if let Err(e) = record_migration(&client, &table, &ctx, elapsed).await {
            rollback(&client).await;
            return done(TenantStatus::Failed, e, Some(rows), sets);
        }
    }

    let summary = if ctx.analysis.read_only {
        format!("Consulta ejecutada. Filas: {}", rows)
    } else {
        format!("Filas afectadas: {}", rows)
    };

    match ctx.opts.mode {
        ExecutionMode::DryRun => {
            rollback(&client).await;
            done(TenantStatus::RolledBack, format!("Dry-run OK, cambios revertidos. {}", summary), Some(rows), sets)
        }
        ExecutionMode::Independent => match client.batch_execute("COMMIT").await {
            Ok(()) => done(TenantStatus::Committed, format!("SQL ejecutado. {}", summary), Some(rows), sets),
            Err(e) => done(TenantStatus::Failed, format!("Error haciendo COMMIT: {}", format_db_error(&e)), Some(rows), sets),
        },
        ExecutionMode::AllOrNothing => {
            // Preparado: liberar el cupo de concurrencia y esperar la decisión global.
            signal.send(true);
            drop(permit);
            let mut rx = ctx.decision.clone();
            let decision = rx
                .wait_for(|d| d.is_some())
                .await
                .map(|d| d.unwrap_or(Decision::Rollback))
                .unwrap_or(Decision::Rollback);

            match decision {
                Decision::Commit => match client.batch_execute("COMMIT").await {
                    Ok(()) => done(TenantStatus::Committed, format!("Commit global. {}", summary), Some(rows), sets),
                    Err(e) => done(
                        TenantStatus::Failed,
                        format!(
                            "COMMIT falló después de la decisión global; este tenant quedó sin aplicar mientras otros sí: {}",
                            format_db_error(&e)
                        ),
                        Some(rows),
                        sets,
                    ),
                },
                Decision::Rollback => {
                    rollback(&client).await;
                    let msg = if ctx.cancel.is_cancelled() {
                        "Revertido: la ejecución fue cancelada".to_string()
                    } else {
                        "Revertido: otro tenant falló (modo todo o nada). Este tenant había ejecutado OK".to_string()
                    };
                    done(TenantStatus::RolledBack, msg, Some(rows), sets)
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn spec(schema: Option<&str>) -> ConnectionSpec {
        ConnectionSpec {
            id: "t".into(),
            db_type: None,
            host: None,
            db: Some("d".into()),
            schema: schema.map(Into::into),
            user: Some("u".into()),
            password: Some("p".into()),
            port: None,
            sslmode: None,
        }
    }

    #[test]
    fn tracking_table_uses_first_schema() {
        assert_eq!(tracking_table(&spec(None)), "\"public\"._tenant_forge_migrations");
        assert_eq!(
            tracking_table(&spec(Some("tenant_a, public"))),
            "\"tenant_a\"._tenant_forge_migrations"
        );
        assert_eq!(
            tracking_table(&spec(Some("\"$user\", public"))),
            "\"public\"._tenant_forge_migrations"
        );
        assert_eq!(tracking_table(&spec(Some("we\"ird"))), "\"we\"\"ird\"._tenant_forge_migrations");
    }

    #[test]
    fn prepare_signal_sends_false_on_drop() {
        let (tx, mut rx) = mpsc::unbounded_channel();
        drop(PrepareSignal::new(Some(tx)));
        assert_eq!(rx.try_recv(), Ok(false));

        let (tx, mut rx) = mpsc::unbounded_channel();
        let mut s = PrepareSignal::new(Some(tx));
        s.send(true);
        drop(s);
        assert_eq!(rx.try_recv(), Ok(true));
        assert!(rx.try_recv().is_err());
    }
}
