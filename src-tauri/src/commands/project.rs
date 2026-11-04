use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::db::AppDb;
use crate::secrets;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDataResult {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub connections: String,
    pub scripts: String,
    pub settings: String,
    /// true si las contraseñas no pudieron guardarse en el keychain del SO
    /// y siguen en texto plano en la base local.
    pub insecure_storage: bool,
}

const PROJECT_COLUMNS: &str = "id, name, description, tags, connections, scripts, settings";

fn row_to_project(row: &Row) -> rusqlite::Result<ProjectDataResult> {
    let tags_json: Option<String> = row.get(3)?;
    let tags: Vec<String> = tags_json
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default();

    Ok(ProjectDataResult {
        id: Some(row.get(0)?),
        name: row.get::<_, Option<String>>(1)?.unwrap_or_default(),
        description: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
        tags,
        connections: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
        scripts: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
        settings: row.get::<_, Option<String>>(6)?.unwrap_or_default(),
        insecure_storage: false,
    })
}

/// Hidrata las contraseñas desde el keychain y migra a él las que aún estén
/// en texto plano en la columna `connections`.
fn hydrate_project(conn: &Connection, mut project: ProjectDataResult) -> ProjectDataResult {
    let Some(id) = project.id else { return project };
    if project.connections.trim().is_empty() {
        return project;
    }
    let Ok(Value::Array(mut list)) = serde_json::from_str::<Value>(&project.connections) else {
        return project;
    };

    // Migración transparente: si hay passwords en claro, moverlas al keychain.
    let outcome = secrets::store_passwords(id, &mut list);
    if outcome.migrated {
        if let Ok(json) = serde_json::to_string(&list) {
            let _ = conn.execute(
                "UPDATE projects SET connections = ?1 WHERE id = ?2",
                params![json, id],
            );
        }
    }
    project.insecure_storage = outcome.insecure;

    secrets::load_passwords(id, &mut list);
    project.connections = serde_json::to_string(&list).unwrap_or(project.connections);
    project
}

#[tauri::command]
pub fn save_project(
    db: State<'_, AppDb>,
    id: i64,
    connections: Vec<Value>,
    scripts: Option<String>,
) -> Result<ExecutionResult, String> {
    let conn = db.conn()?;

    let mut connections = connections;
    let outcome = secrets::store_passwords_pruning(id, &mut connections);
    let connections_json = serde_json::to_string(&connections).map_err(|e| e.to_string())?;
    let scripts_val = scripts.unwrap_or_default();

    conn.execute(
        "UPDATE projects SET connections = ?1, scripts = ?2 WHERE id = ?3",
        params![connections_json, scripts_val, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(ExecutionResult {
        success: true,
        message: if outcome.insecure {
            "Proyecto guardado, pero el keychain del sistema no está disponible: las contraseñas quedaron en la base local".to_string()
        } else {
            "Project updated successfully".to_string()
        },
    })
}

#[tauri::command]
pub fn save_project_settings(db: State<'_, AppDb>, id: i64, settings: Value) -> Result<(), String> {
    let conn = db.conn()?;
    let json = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE projects SET settings = ?1 WHERE id = ?2",
        params![json, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_proyect(
    db: State<'_, AppDb>,
    name: String,
    description: String,
    tags: Option<Vec<String>>,
) -> Result<(), String> {
    let conn = db.conn()?;
    let tags_json = serde_json::to_string(&tags.unwrap_or_default()).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO projects (name, description, tags, connections, scripts) VALUES (?1, ?2, ?3, NULL, NULL)",
        params![name, description, tags_json],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_projects(db: State<'_, AppDb>) -> Result<Vec<ProjectDataResult>, String> {
    let conn = db.conn()?;
    let mut stmt = conn
        .prepare(&format!("SELECT {} FROM projects", PROJECT_COLUMNS))
        .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], row_to_project)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(projects
        .into_iter()
        .map(|p| hydrate_project(&conn, p))
        .collect())
}

#[tauri::command]
pub fn get_project_by_id(db: State<'_, AppDb>, id: i64) -> Result<Option<ProjectDataResult>, String> {
    let conn = db.conn()?;
    let project = conn
        .query_row(
            &format!("SELECT {} FROM projects WHERE id = ?1", PROJECT_COLUMNS),
            params![id],
            row_to_project,
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(project.map(|p| hydrate_project(&conn, p)))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Esquema real encontrado en bases de desarrollo antiguas: name nullable, sin AUTOINCREMENT.
    #[test]
    fn reads_legacy_rows_with_nulls_after_migration() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT, description TEXT, tags TEXT, connections TEXT, scripts TEXT);
             INSERT INTO projects (id, name) VALUES (1, NULL);
             INSERT INTO projects (id, name, tags, connections) VALUES (2, 'p', '["a"]', '[]');"#,
        )
        .unwrap();
        crate::db::migrate(&mut conn).unwrap();

        let mut stmt = conn
            .prepare(&format!("SELECT {} FROM projects ORDER BY id", PROJECT_COLUMNS))
            .unwrap();
        let rows: Vec<_> = stmt
            .query_map([], row_to_project)
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap();
        assert_eq!(rows[0].name, "");
        assert_eq!(rows[1].tags, vec!["a".to_string()]);
        assert_eq!(rows[1].settings, "");
    }
}
