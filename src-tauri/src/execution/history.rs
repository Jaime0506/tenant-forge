//! Historial local de ejecuciones (SQLite).

use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use tauri::State;

use super::types::{ExecutionOptions, TenantResult, TenantStatus};
use crate::db::AppDb;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionSummary {
    pub id: String,
    pub project_id: Option<i64>,
    pub script_hash: String,
    pub sql: String,
    pub mode: String,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub total: i64,
    pub ok: i64,
    pub failed: i64,
    pub cancelled: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredResult {
    pub connection_id: String,
    pub status: String,
    pub message: String,
    pub duration_ms: Option<i64>,
    pub rows_affected: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionDetail {
    #[serde(flatten)]
    pub summary: ExecutionSummary,
    pub results: Vec<StoredResult>,
}

pub fn save(
    conn: &mut Connection,
    opts: &ExecutionOptions,
    script_hash: &str,
    sql: &str,
    started_at: &str,
    finished_at: &str,
    results: &[TenantResult],
) -> Result<(), String> {
    let count = |pred: fn(&TenantResult) -> bool| results.iter().filter(|r| pred(r)).count() as i64;
    let ok = count(|r| r.success);
    let cancelled = count(|r| r.status == TenantStatus::Cancelled);
    let failed = results.len() as i64 - ok - cancelled;

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT OR REPLACE INTO executions
            (id, project_id, script_hash, sql, mode, started_at, finished_at, total, ok, failed, cancelled)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            opts.execution_id,
            opts.project_id,
            script_hash,
            sql,
            opts.mode.as_str(),
            started_at,
            finished_at,
            results.len() as i64,
            ok,
            failed,
            cancelled
        ],
    )
    .map_err(|e| e.to_string())?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT INTO execution_results
                    (execution_id, connection_id, status, message, duration_ms, rows_affected)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            )
            .map_err(|e| e.to_string())?;
        for r in results {
            stmt.execute(params![
                opts.execution_id,
                r.connection_id,
                r.status.as_str(),
                r.message,
                r.duration_ms as i64,
                r.rows_affected.map(|n| n as i64)
            ])
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())
}

const SUMMARY_COLUMNS: &str =
    "id, project_id, script_hash, sql, mode, started_at, finished_at, total, ok, failed, cancelled";

fn row_to_summary(row: &rusqlite::Row) -> rusqlite::Result<ExecutionSummary> {
    Ok(ExecutionSummary {
        id: row.get(0)?,
        project_id: row.get(1)?,
        script_hash: row.get(2)?,
        sql: row.get(3)?,
        mode: row.get(4)?,
        started_at: row.get(5)?,
        finished_at: row.get(6)?,
        total: row.get(7)?,
        ok: row.get(8)?,
        failed: row.get(9)?,
        cancelled: row.get(10)?,
    })
}

pub fn list(conn: &Connection, project_id: i64, limit: i64) -> Result<Vec<ExecutionSummary>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM executions WHERE project_id = ?1 ORDER BY started_at DESC LIMIT ?2",
            SUMMARY_COLUMNS
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![project_id, limit], row_to_summary)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    rows
}

pub fn get(conn: &Connection, id: &str) -> Result<Option<ExecutionDetail>, String> {
    let summary = conn
        .query_row(
            &format!("SELECT {} FROM executions WHERE id = ?1", SUMMARY_COLUMNS),
            params![id],
            row_to_summary,
        )
        .optional()
        .map_err(|e| e.to_string())?;
    let Some(summary) = summary else { return Ok(None) };

    let mut stmt = conn
        .prepare(
            "SELECT connection_id, status, message, duration_ms, rows_affected
             FROM execution_results WHERE execution_id = ?1 ORDER BY rowid",
        )
        .map_err(|e| e.to_string())?;
    let results = stmt
        .query_map(params![id], |r| {
            Ok(StoredResult {
                connection_id: r.get(0)?,
                status: r.get(1)?,
                message: r.get(2)?,
                duration_ms: r.get(3)?,
                rows_affected: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(Some(ExecutionDetail { summary, results }))
}

#[tauri::command]
pub fn list_executions(
    db: State<'_, AppDb>,
    project_id: i64,
    limit: Option<i64>,
) -> Result<Vec<ExecutionSummary>, String> {
    let conn = db.conn()?;
    list(&conn, project_id, limit.unwrap_or(50).clamp(1, 500))
}

#[tauri::command]
pub fn get_execution(db: State<'_, AppDb>, id: String) -> Result<Option<ExecutionDetail>, String> {
    let conn = db.conn()?;
    get(&conn, &id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::execution::types::ExecutionMode;

    fn opts() -> ExecutionOptions {
        serde_json::from_value(serde_json::json!({
            "executionId": "e1", "projectId": 3, "mode": "all_or_nothing"
        }))
        .unwrap()
    }

    fn result(id: &str, status: TenantStatus, success: bool) -> TenantResult {
        TenantResult {
            connection_id: id.into(),
            success,
            message: "m".into(),
            status,
            duration_ms: 5,
            rows_affected: Some(1),
            result_sets: vec![],
        }
    }

    #[test]
    fn save_and_read_back() {
        let db = AppDb::in_memory();
        let mut conn = db.conn().unwrap();
        let o = opts();
        assert_eq!(o.mode, ExecutionMode::AllOrNothing);
        assert!(o.track_migration, "trackMigration debe ser true por defecto");
        let results = vec![
            result("a", TenantStatus::Committed, true),
            result("b", TenantStatus::Failed, false),
            result("c", TenantStatus::Cancelled, false),
        ];
        save(&mut conn, &o, "h", "SELECT 1", "2026-01-01T00:00:00Z", "2026-01-01T00:00:01Z", &results).unwrap();

        let list = list(&conn, 3, 10).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!((list[0].ok, list[0].failed, list[0].cancelled), (1, 1, 1));

        let detail = get(&conn, "e1").unwrap().unwrap();
        assert_eq!(detail.results.len(), 3);
        assert_eq!(detail.results[1].status, "failed");
    }
}
