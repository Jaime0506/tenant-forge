// es como un index.ts de la carpeta commands
mod commands;

use commands::sql_execute::execute_sql;
use commands::project::{save_project, create_proyect, get_projects};

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
