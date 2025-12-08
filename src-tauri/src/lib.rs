use rusqlite::{Connection, params};

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
    println!("Creating proyect");

    println!("Name: {}, description: {}, tags: {:?}", name, description, tags); 

    Ok(()) 
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            create_user, 
            create_proyect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
