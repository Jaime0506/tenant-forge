// es como un index.ts de la carpeta commands
mod commands;

use commands::sql_execute::execute_sql;
use commands::project::save_project;

use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    #[serde(default)]
    pub connections: Option<Vec<Value>>,
}

#[tauri::command]
fn create_proyect(name: String, description: String, tags: Option<Vec<String>>) -> Result<(), String> {
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
fn get_projects() -> Result<Vec<ProjectData>, String> {
    let conn = Connection::open("app.db").map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, name, description, tags, connections FROM projects")
        .map_err(|e| e.to_string())?;
    
    let projects = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let name: String = row.get(1)?;
        let description: String = row.get(2)?;
        let tags_json: String = row.get(3)?;
        
        // Manejar connections que puede ser NULL
        let connections_raw: Option<String> = row.get(4)?;
        println!("[get_projects] Raw connections value: {:?}", connections_raw);
        
        let connections: Option<Vec<Value>> = match connections_raw {
            Some(connections_json) => {
                println!("[get_projects] Connections JSON string: {}", connections_json);
                // Intentar parsear como array de objetos JSON
                match serde_json::from_str::<Vec<Value>>(&connections_json) {
                    Ok(conns) => Some(conns),
                    Err(_) => {
                        // Si falla, intentar parsear como un solo objeto y convertirlo a array
                        match serde_json::from_str::<Value>(&connections_json) {
                            Ok(val) => {
                                if val.is_array() {
                                    val.as_array().cloned()
                                } else {
                                    Some(vec![val])
                                }
                            },
                            Err(_) => None,
                        }
                    }
                }
            },
            None => None,
        };
        
        let tags: Vec<String> = serde_json::from_str(&tags_json)
            .unwrap_or_else(|_| Vec::new());
        
        Ok(ProjectData {
            id: Some(id),
            name,
            description,
            tags,
            connections,
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
            create_proyect,
            get_projects,
            execute_sql,
            save_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
