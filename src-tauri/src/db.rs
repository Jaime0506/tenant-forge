use tauri::{AppHandle, Manager};

pub fn get_db_path(app: &AppHandle) -> Result<String, String> {

    const DB_NAME: &str = "tenant-forge.db";
    // DEV
    if cfg!(debug_assertions) {
        return Ok(DB_NAME.to_string());
    }

    // PROD Windows
    #[cfg(target_os = "windows")]
    {
        return Ok(DB_NAME.to_string());
    }

    // PROD macOS / Linux
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let db_path = app_dir.join(DB_NAME);
    Ok(db_path.to_string_lossy().to_string())
}
