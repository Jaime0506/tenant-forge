use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params};
use serde_json::Value;

use tauri::{AppHandle};
use crate::db::get_db_path;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn save_project(app: AppHandle, id: i64, connections: Vec<Value>, scripts: Option<String>) -> Result<ExecutionResult, String> {
    println!("Saving project with id: {}", id);
    println!("Connections: {:?}", connections);

    let db_path = get_db_path(&app)?;
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Asegurarnos de que la columna existe por si venimos de una versión anterior
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN scripts TEXT", []);

    // Convertir el vector de connections a JSON string
    let connections_json = serde_json::to_string(&connections).map_err(|e| e.to_string())?;
    
    let scripts_val = scripts.unwrap_or_else(|| "".to_string());

    // Actualizar el proyecto con las connections y scripts
    conn.execute(
        "UPDATE projects SET connections = ?1, scripts = ?2 WHERE id = ?3",
        params![connections_json, scripts_val, id],
    ).map_err(|e| e.to_string())?;

    println!("Project {} updated successfully", id);
    Ok(ExecutionResult {
        success: true,
        message: "Project updated successfully".to_string(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDataResult {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub connections: String, 
    pub scripts: String,
}

#[tauri::command]
pub fn create_proyect(app: AppHandle, name: String, description: String, tags: Option<Vec<String>>) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT, description TEXT, tags TEXT, connections TEXT, scripts TEXT)",
        [],
    ).map_err(|e| e.to_string())?;
    
    // Convertir el vector de tags a JSON string
    let tags_json = match tags {
        Some(tags_vec) => serde_json::to_string(&tags_vec).map_err(|e| e.to_string())?,
        None => "[]".to_string(),
    };
    
    conn.execute(
        "INSERT INTO projects (name, description, tags, connections, scripts) VALUES (?1, ?2, ?3, NULL, NULL)",
        params![name, description, tags_json],
    ).map_err(|e| e.to_string())?;

    Ok(()) 
}

#[tauri::command]
pub fn get_projects(app: AppHandle) -> Result<Vec<ProjectDataResult>, String> {
    let db_path = get_db_path(&app)?;
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Intentar agregar la columna por si es una bd antigua
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN scripts TEXT", []);

    let mut stmt = conn.prepare("SELECT id, name, description, tags, connections, scripts FROM projects")
        .map_err(|e| e.to_string())?;
    
    let projects = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let name: String = row.get(1)?;
        let description: String = row.get(2)?;
        let tags_json: String = row.get(3)?;
        
        // Obtener connections como string simple (puede ser NULL)
        let connections: String = row.get::<_, Option<String>>(4)?
            .unwrap_or_else(|| "".to_string());

        // Obtener scripts como string simple
        let scripts: String = row.get::<_, Option<String>>(5)?
            .unwrap_or_else(|| "".to_string());
        
        let tags: Vec<String> = serde_json::from_str(&tags_json)
            .unwrap_or_else(|_| Vec::new());
        
        Ok(ProjectDataResult {
            id: Some(id),
            name,
            description,
            tags,
            connections,
            scripts,
        })
    }).map_err(|e| e.to_string())?;

    let result: Result<Vec<ProjectDataResult>, rusqlite::Error> = projects.collect();
    result.map_err(|e| e.to_string())
}