use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_user(name: String) -> Result<(), String> {
    println!("Creating user: {}", name);

    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (name) VALUES (?1)",
        params![name],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn create_proyect(name: String, description: String, tags: Option<Vec<String>>) -> Result<(), String> {
    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT, description TEXT, tags TEXT)",
        [],
    ).map_err(|e| e.to_string())?;
    
    // Convertir el vector de tags a JSON string
    let tags_json = match tags {
        Some(tags_vec) => serde_json::to_string(&tags_vec).map_err(|e| e.to_string())?,
        None => "[]".to_string(),
    };
    
    conn.execute(
        "INSERT INTO projects (name, description, tags) VALUES (?1, ?2, ?3)",
        params![name, description, tags_json],
    ).map_err(|e| e.to_string())?;

    Ok(()) 
}

#[tauri::command]
fn get_projects() -> Result<Vec<ProjectData>, String> {
    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, name, description, tags FROM projects")
        .map_err(|e| e.to_string())?;
    
    let projects = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let name: String = row.get(1)?;
        let description: String = row.get(2)?;
        let tags_json: String = row.get(3)?;
        
        let tags: Vec<String> = serde_json::from_str(&tags_json)
            .unwrap_or_else(|_| Vec::new());
        
        Ok(ProjectData {
            id: Some(id),
            name,
            description,
            tags,
        })
    }).map_err(|e| e.to_string())?;

    let result: Result<Vec<ProjectData>, rusqlite::Error> = projects.collect();
    result.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            create_user, 
            create_proyect,
            get_projects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
