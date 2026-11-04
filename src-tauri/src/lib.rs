mod commands;
mod db;
mod execution;
mod secrets;

use commands::project::{create_proyect, get_project_by_id, get_projects, save_project, save_project_settings};
use execution::history::{get_execution, list_executions};
use execution::{cancel_execution, execute_sql, get_migration_status, ExecutionRegistry};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = db::AppDb::open(app.handle())?;
            app.manage(db);
            app.manage(ExecutionRegistry::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_proyect,
            get_projects,
            get_project_by_id,
            save_project,
            save_project_settings,
            execute_sql,
            cancel_execution,
            get_migration_status,
            list_executions,
            get_execution
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
