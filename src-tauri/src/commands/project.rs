use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn save_project(id: i64, connections: Vec<Value>) -> Result<ExecutionResult, String> {
    println!("Saving project with id: {}", id);
    println!("Connections: {:?}", connections);

    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    // Convertir el vector de connections a JSON string
    let connections_json = serde_json::to_string(&connections).map_err(|e| e.to_string())?;

    // Actualizar el proyecto con las connections
    conn.execute(
        "UPDATE projects SET connections = ?1 WHERE id = ?2",
        params![connections_json, id],
    ).map_err(|e| e.to_string())?;

    println!("Project {} updated successfully", id);
    Ok(ExecutionResult {
        success: true,
        message: "Project updated successfully".to_string(),
    })
}