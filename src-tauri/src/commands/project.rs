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

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDataResult {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub connections: String, 
}

#[tauri::command]
pub fn create_proyect(name: String, description: String, tags: Option<Vec<String>>) -> Result<(), String> {
    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT, description TEXT, tags TEXT, connections TEXT)",
        [],
    ).map_err(|e| e.to_string())?;
    
    // Convertir el vector de tags a JSON string
    let tags_json = match tags {
        Some(tags_vec) => serde_json::to_string(&tags_vec).map_err(|e| e.to_string())?,
        None => "[]".to_string(),
    };
    
    conn.execute(
        "INSERT INTO projects (name, description, tags, connections) VALUES (?1, ?2, ?3, NULL)",
        params![name, description, tags_json],
    ).map_err(|e| e.to_string())?;

    Ok(()) 
}

#[tauri::command]
pub fn get_projects() -> Result<Vec<ProjectDataResult>, String> {
    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, name, description, tags, connections FROM projects")
        .map_err(|e| e.to_string())?;
    
    let projects = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let name: String = row.get(1)?;
        let description: String = row.get(2)?;
        let tags_json: String = row.get(3)?;
        
        // Obtener connections como string simple (puede ser NULL)
        let connections: String = row.get::<_, Option<String>>(4)?
            .unwrap_or_else(|| "".to_string());
        
        let tags: Vec<String> = serde_json::from_str(&tags_json)
            .unwrap_or_else(|_| Vec::new());
        
        Ok(ProjectDataResult {
            id: Some(id),
            name,
            description,
            tags,
            connections,
        })
    }).map_err(|e| e.to_string())?;

    let result: Result<Vec<ProjectDataResult>, rusqlite::Error> = projects.collect();
    result.map_err(|e| e.to_string())
}