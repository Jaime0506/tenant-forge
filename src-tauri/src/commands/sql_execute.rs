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
    let (mut client, connection) = match tokio_postgres::connect(&connection_string, NoTls).await {
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
    
    let sql_trimmed = sql.trim();
    let sql_upper = sql_trimmed.to_uppercase();
    
    // Detectar tipos de statements que requieren batch_execute
    // DDL (Data Definition Language)
    let has_ddl = sql_upper.contains("CREATE ") 
        || sql_upper.contains("ALTER ") 
        || sql_upper.contains("DROP ")
        || sql_upper.contains("TRUNCATE ")
        || sql_upper.contains("COMMENT ON");
    
    // DCL (Data Control Language)
    let has_dcl = sql_upper.contains("GRANT ") 
        || sql_upper.contains("REVOKE ");
    
    // Funciones y procedimientos
    let has_functions = sql_upper.contains("CREATE FUNCTION")
        || sql_upper.contains("CREATE OR REPLACE FUNCTION")
        || sql_upper.contains("CREATE PROCEDURE")
        || sql_upper.contains("CREATE OR REPLACE PROCEDURE");
    
    // CREATE TABLE AS SELECT (DML complejo)
    let has_create_table_as = sql_upper.contains("CREATE TABLE") && sql_upper.contains("AS SELECT");
    
    // Múltiples statements (contar puntos y coma, pero ignorar los que están en strings)
    // Nota: Esta es una aproximación simple. Para un análisis más preciso,
    // se necesitaría un parser SQL completo.
    let semicolon_count = sql_trimmed.matches(';').count();
    let has_multiple_statements = semicolon_count > 1;
    
    // Siempre usar batch_execute para:
    // - DDL statements (CREATE, ALTER, DROP, etc.)
    // - DCL statements (GRANT, REVOKE)
    // - Funciones y procedimientos
    // - CREATE TABLE AS SELECT
    // - Múltiples statements
    let use_batch = has_ddl || has_dcl || has_functions || has_create_table_as || has_multiple_statements;
    
    if use_batch {
        // Usar batch_execute para statements que no retornan filas o múltiples statements
        let statement_type = if has_ddl { "DDL" }
            else if has_dcl { "DCL" }
            else if has_functions { "FUNCTION/PROCEDURE" }
            else if has_create_table_as { "CREATE TABLE AS SELECT" }
            else { "MÚLTIPLES STATEMENTS" };
        
        println!("[{}] Detectado: {}, usando batch_execute", connection_id, statement_type);
        println!("[{}] SQL a ejecutar:\n{}", connection_id, sql);
        
        // Usar una transacción explícita para garantizar que todas las sentencias
        // se ejecuten en orden y que si una falla, todas se reviertan
        let transaction = match client.transaction().await {
            Ok(txn) => txn,
            Err(e) => {
                let error_msg = format!("Error iniciando transacción: {}", e);
                println!("[{}] {}", connection_id, error_msg);
                return Err(ExecutionResult {
                    connection_id: connection_id.clone(),
                    success: false,
                    message: error_msg,
                });
            }
        };
        
        // Establecer el search_path dentro de la transacción si hay un schema especificado
        // Esto asegura que los tipos y objetos se creen y referencien correctamente
        if let Some(schema) = &conn.schema {
            let set_schema_sql = format!("SET search_path TO {}", schema);
            if let Err(e) = transaction.execute(&set_schema_sql, &[]).await {
                let error_msg = format!("Error estableciendo schema '{}' en transacción: {}", schema, e);
                println!("[{}] {}", connection_id, error_msg);
                return Err(ExecutionResult {
                    connection_id: connection_id.clone(),
                    success: false,
                    message: error_msg,
                });
            }
            println!("[{}] Schema establecido en transacción: {}", connection_id, schema);
        }
        
        // Ejecutar el SQL dentro de la transacción
        match transaction.batch_execute(sql).await {
            Ok(_) => {
                // Commit de la transacción
                match transaction.commit().await {
                    Ok(_) => {
                        let success_msg = format!("SQL ejecutado exitosamente ({})", statement_type);
                        println!("[{}] {}", connection_id, success_msg);
                        Ok(ExecutionResult {
                            connection_id: connection_id.clone(),
                            success: true,
                            message: success_msg,
                        })
                    }
                    Err(e) => {
                        let error_msg = format!("Error haciendo commit: {}", e);
                        println!("[{}] {}", connection_id, error_msg);
                        Err(ExecutionResult {
                            connection_id: connection_id.clone(),
                            success: false,
                            message: error_msg,
                        })
                    }
                }
            }
            Err(e) => {
                // Rollback automático al salir del scope, pero informamos el error
                let error_msg = if let Some(db_error) = e.as_db_error() {
                    format!(
                        "Error de base de datos: {} (Código: {})",
                        db_error.message(),
                        db_error.code().code()
                    )
                } else {
                    format!("Error ejecutando SQL: {}", e)
                };
                
                println!("[{}] {} (transacción revertida)", connection_id, error_msg);
                Err(ExecutionResult {
                    connection_id: connection_id.clone(),
                    success: false,
                    message: error_msg,
                })
            }
        }
    } else {
        // Usar execute para DML simple (INSERT, UPDATE, DELETE) que retorna filas afectadas
        // Nota: SELECT también funcionaría pero no retornaría los datos, solo el número de filas
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