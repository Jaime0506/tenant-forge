use rusqlite::Connection;
use std::sync::{Mutex, MutexGuard};
use tauri::{AppHandle, Manager};

const DB_NAME: &str = "tenant-forge.db";

/// Conexión SQLite compartida por toda la app (registrada con `app.manage`).
pub struct AppDb(Mutex<Connection>);

impl AppDb {
    /// Abre la base local y aplica las migraciones pendientes.
    pub fn open(app: &AppHandle) -> Result<Self, String> {
        let db_path = get_db_path(app)?;
        let mut conn = Connection::open(db_path).map_err(|e| e.to_string())?;
        migrate(&mut conn)?;
        Ok(AppDb(Mutex::new(conn)))
    }

    #[cfg(test)]
    pub fn in_memory() -> Self {
        let mut conn = Connection::open_in_memory().expect("sqlite en memoria");
        migrate(&mut conn).expect("migraciones");
        AppDb(Mutex::new(conn))
    }

    pub fn conn(&self) -> Result<MutexGuard<'_, Connection>, String> {
        self.0
            .lock()
            .map_err(|_| "La conexión SQLite quedó envenenada por un panic previo".to_string())
    }
}

pub fn get_db_path(app: &AppHandle) -> Result<String, String> {
    // DEV: En desarrollo se sitúa en src-tauri/tenant-forge.db
    if cfg!(debug_assertions) {
        return Ok(DB_NAME.to_string());
    }

    // PROD (Windows, macOS, Linux): Siempre en AppData / Application Support
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let db_path = app_dir.join(DB_NAME);
    Ok(db_path.to_string_lossy().to_string())
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({})", table))
        .map_err(|e| e.to_string())?;
    let names = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(names.iter().any(|n| n == column))
}

/// Migraciones versionadas con `PRAGMA user_version`.
/// Cada paso es idempotente para soportar bases creadas por versiones previas
/// (que no usaban user_version).
pub fn migrate(conn: &mut Connection) -> Result<(), String> {
    let version: i64 = conn
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    if version < 1 {
        tx.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                tags TEXT,
                connections TEXT,
                scripts TEXT
            )",
            [],
        )
        .map_err(|e| format!("Migración 1 (projects): {}", e))?;
        if !column_exists(&tx, "projects", "scripts")? {
            tx.execute("ALTER TABLE projects ADD COLUMN scripts TEXT", [])
                .map_err(|e| format!("Migración 1 (scripts): {}", e))?;
        }
    }

    if version < 2 && !column_exists(&tx, "projects", "settings")? {
        tx.execute("ALTER TABLE projects ADD COLUMN settings TEXT", [])
            .map_err(|e| format!("Migración 2 (settings): {}", e))?;
    }

    if version < 3 {
        tx.execute_batch(
            "CREATE TABLE IF NOT EXISTS executions (
                id TEXT PRIMARY KEY,
                project_id INTEGER,
                script_hash TEXT NOT NULL,
                sql TEXT NOT NULL,
                mode TEXT NOT NULL,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                total INTEGER NOT NULL DEFAULT 0,
                ok INTEGER NOT NULL DEFAULT 0,
                failed INTEGER NOT NULL DEFAULT 0,
                cancelled INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_executions_project ON executions(project_id, started_at);
            CREATE TABLE IF NOT EXISTS execution_results (
                execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
                connection_id TEXT NOT NULL,
                status TEXT NOT NULL,
                message TEXT NOT NULL,
                duration_ms INTEGER,
                rows_affected INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_execution_results_exec ON execution_results(execution_id);",
        )
        .map_err(|e| format!("Migración 3 (historial): {}", e))?;
    }

    tx.execute_batch(&format!("PRAGMA user_version = {}", LATEST_VERSION))
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())
}

pub const LATEST_VERSION: i64 = 3;

#[cfg(test)]
mod tests {
    use super::*;

    fn version(conn: &Connection) -> i64 {
        conn.query_row("PRAGMA user_version", [], |r| r.get(0)).unwrap()
    }

    #[test]
    fn fresh_database_reaches_latest_version() {
        let mut conn = Connection::open_in_memory().unwrap();
        migrate(&mut conn).unwrap();
        assert_eq!(version(&conn), LATEST_VERSION);
        assert!(column_exists(&conn, "projects", "settings").unwrap());
        assert!(column_exists(&conn, "executions", "script_hash").unwrap());
    }

    #[test]
    fn legacy_database_is_upgraded_without_data_loss() {
        let mut conn = Connection::open_in_memory().unwrap();
        // Esquema de versiones previas: sin scripts, sin user_version
        conn.execute_batch(
            "CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
             description TEXT, tags TEXT, connections TEXT);
             INSERT INTO projects (name, description, tags) VALUES ('p', 'd', '[]');",
        )
        .unwrap();
        migrate(&mut conn).unwrap();
        assert_eq!(version(&conn), LATEST_VERSION);
        assert!(column_exists(&conn, "projects", "scripts").unwrap());
        let n: i64 = conn
            .query_row("SELECT count(*) FROM projects", [], |r| r.get(0))
            .unwrap();
        assert_eq!(n, 1);
    }

    #[test]
    fn migrate_is_idempotent() {
        let mut conn = Connection::open_in_memory().unwrap();
        migrate(&mut conn).unwrap();
        migrate(&mut conn).unwrap();
        assert_eq!(version(&conn), LATEST_VERSION);
    }
}
