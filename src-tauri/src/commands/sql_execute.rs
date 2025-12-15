use serde::{Deserialize, Serialize};
use tokio_postgres::NoTls;

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseConnection {
    pub id: String,
    #[serde(rename = "type")]
    pub db_type: Option<String>,
    pub host: Option<String>,
    pub db: Option<String>,
    pub schema: Option<String>,
    pub user: Option<String>,
    pub password: Option<String>,
    pub port: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub connection_id: String,
    pub success: bool,
    pub message: String,
}

/// Construye la connection string para PostgreSQL
fn build_connection_string(conn: &DatabaseConnection) -> Result<String, String> {
    let host = conn.host.as_deref().unwrap_or("localhost");
    let port = conn.port.unwrap_or(5432);
    let user = conn.user.as_deref().ok_or("User is required")?;
    let password = conn.password.as_deref().ok_or("Password is required")?;
    let db = conn.db.as_deref().ok_or("Database name is required")?;

    Ok(format!(
        "host={} port={} user={} password={} dbname={}",
        host, port, user, password, db
    ))
}

/// Ejecuta SQL en una conexión específica
async fn execute_on_connection(
    conn: &DatabaseConnection,
    sql: &str,
) -> Result<ExecutionResult, ExecutionResult> {
    let connection_id = conn.id.clone();
    
    println!("[{}] Iniciando conexión...", connection_id);
    
    // Construir connection string
    let connection_string = match build_connection_string(conn) {
        Ok(cs) => cs,
        Err(e) => {
            let error_msg = format!("Error construyendo connection string: {}", e);
            println!("[{}] {}", connection_id, error_msg);
            return Err(ExecutionResult {
                connection_id: connection_id.clone(),
                success: false,
                message: error_msg,
            });
        }
    };

    // Conectar a la base de datos
    let (client, connection) = match tokio_postgres::connect(&connection_string, NoTls).await {
        Ok((c, conn)) => (c, conn),
        Err(e) => {
            // Obtener detalles más específicos del error de conexión
            let error_msg = if e.to_string().contains("password authentication failed") {
                format!("Error de autenticación: Usuario o contraseña incorrectos")
            } else if e.to_string().contains("connection refused") {
                format!("Error de conexión: No se pudo conectar al servidor. Verifica que el servidor esté corriendo y el puerto sea correcto")
            } else if e.to_string().contains("does not exist") {
                format!("Error: La base de datos no existe")
            } else {
                format!("Error conectando a la base de datos: {}", e)
            };
            
            println!("[{}] {}", connection_id, error_msg);
            return Err(ExecutionResult {
                connection_id: connection_id.clone(),
                success: false,
                message: error_msg,
            });
        }
    };

    // Ejecutar la conexión en segundo plano
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Error en la conexión: {}", e);
        }
    });

    println!("[{}] Conectado exitosamente", connection_id);

    // Establecer el schema si está especificado
    if let Some(schema) = &conn.schema {
        let set_schema_sql = format!("SET search_path TO {}", schema);
        if let Err(e) = client.execute(&set_schema_sql, &[]).await {
            let error_msg = format!("Error estableciendo schema '{}': {}", schema, e);
            println!("[{}] {}", connection_id, error_msg);
            return Err(ExecutionResult {
                connection_id: connection_id.clone(),
                success: false,
                message: error_msg,
            });
        }
        println!("[{}] Schema establecido: {}", connection_id, schema);
    }

    // Ejecutar el SQL
    println!("[{}] Ejecutando SQL...", connection_id);
    match client.execute(sql, &[]).await {
        Ok(rows_affected) => {
            let success_msg = format!("SQL ejecutado exitosamente. Filas afectadas: {}", rows_affected);
            println!("[{}] {}", connection_id, success_msg);
            Ok(ExecutionResult {
                connection_id: connection_id.clone(),
                success: true,
                message: success_msg,
            })
        }
        Err(e) => {
            // Obtener detalles más específicos del error
            let error_msg = if let Some(db_error) = e.as_db_error() {
                format!(
                    "Error de base de datos: {} (Código: {})",
                    db_error.message(),
                    db_error.code().code()
                )
            } else {
                format!("Error ejecutando SQL: {}", e)
            };
            
            println!("[{}] {}", connection_id, error_msg);
            Err(ExecutionResult {
                connection_id: connection_id.clone(),
                success: false,
                message: error_msg,
            })
        }
    }
}

#[tauri::command]
pub async fn execute_sql(
    sql: String,
    connections: Vec<DatabaseConnection>,
) -> Result<Vec<ExecutionResult>, String> {
    println!("=== Iniciando ejecución de SQL ===");
    println!("SQL: {}", sql);
    println!("Número de conexiones: {}", connections.len());
    println!();

    let mut results = Vec::new();

    // Ejecutar SQL en cada conexión
    for conn in connections {
        match execute_on_connection(&conn, &sql).await {
            Ok(result) => {
                results.push(result);
            }
            Err(result) => {
                results.push(result);
            }
        }
        println!(); // Línea en blanco entre ejecuciones
    }

    // Resumen
    let successful = results.iter().filter(|r| r.success).count();
    let failed = results.len() - successful;
    
    println!("=== Resumen de ejecución ===");
    println!("Total: {}", results.len());
    println!("Exitosas: {}", successful);
    println!("Fallidas: {}", failed);
    println!();

    Ok(results)
}