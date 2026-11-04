//! Conexión a Postgres: construcción de `Config`, TLS y timeouts.

use native_tls::TlsConnector;
use postgres_native_tls::MakeTlsConnector;
use std::time::Duration;
use tokio_postgres::config::SslMode;
use tokio_postgres::{Client, Config};
use tokio_util::sync::CancellationToken;

use super::types::ConnectionSpec;

pub const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);

pub enum ConnectError {
    Cancelled,
    Failed(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Ssl {
    Disable,
    Prefer,
    Require,
    VerifyFull,
}

fn parse_sslmode(raw: Option<&str>) -> Result<Ssl, String> {
    match raw.map(|s| s.trim().to_ascii_lowercase()).as_deref() {
        None | Some("") | Some("prefer") | Some("allow") => Ok(Ssl::Prefer),
        Some("disable") => Ok(Ssl::Disable),
        Some("require") => Ok(Ssl::Require),
        Some("verify-full") | Some("verify-ca") => Ok(Ssl::VerifyFull),
        Some(other) => Err(format!(
            "SSLMODE '{}' no válido (usa disable, prefer, require o verify-full)",
            other
        )),
    }
}

pub fn validate_type(spec: &ConnectionSpec) -> Result<(), String> {
    match spec.db_type.as_deref().map(|t| t.trim().to_ascii_lowercase()).as_deref() {
        None | Some("") | Some("postgres") | Some("postgresql") | Some("pg") => Ok(()),
        Some(other) => Err(format!(
            "Tipo de BD no soportado: '{}'. Por ahora solo se admite PostgreSQL",
            other
        )),
    }
}

/// Construye la configuración y el conector TLS para una conexión.
pub fn build(spec: &ConnectionSpec) -> Result<(Config, MakeTlsConnector), String> {
    let user = spec.user.as_deref().filter(|s| !s.is_empty()).ok_or("Falta el usuario (USER)")?;
    let password = spec.password.as_deref().ok_or("Falta la contraseña (PASSWORD)")?;
    let db = spec.db.as_deref().filter(|s| !s.is_empty()).ok_or("Falta el nombre de la base (DB)")?;
    let ssl = parse_sslmode(spec.sslmode.as_deref())?;

    let mut config = Config::new();
    config
        .host(spec.host.as_deref().filter(|s| !s.is_empty()).unwrap_or("localhost"))
        .port(spec.port.unwrap_or(5432))
        .user(user)
        .password(password)
        .dbname(db)
        .application_name("tenant-forge")
        .connect_timeout(CONNECT_TIMEOUT)
        .ssl_mode(match ssl {
            Ssl::Disable => SslMode::Disable,
            Ssl::Prefer => SslMode::Prefer,
            Ssl::Require | Ssl::VerifyFull => SslMode::Require,
        });

    // Igual que libpq: prefer/require cifran pero no validan el certificado;
    // verify-full valida cadena y hostname.
    let lenient = ssl != Ssl::VerifyFull;
    let connector = TlsConnector::builder()
        .danger_accept_invalid_certs(lenient)
        .danger_accept_invalid_hostnames(lenient)
        .build()
        .map_err(|e| format!("No se pudo inicializar TLS: {}", e))?;

    Ok((config, MakeTlsConnector::new(connector)))
}

fn friendly_error(e: &tokio_postgres::Error) -> String {
    if let Some(db) = e.as_db_error() {
        return match db.code().code() {
            "28P01" => "Error de autenticación: usuario o contraseña incorrectos".into(),
            "3D000" => format!("La base de datos no existe: {}", db.message()),
            "28000" => format!("Acceso denegado: {}", db.message()),
            _ => format!("Error conectando: {} (Código: {})", db.message(), db.code().code()),
        };
    }
    let s = e.to_string();
    if s.contains("refused") {
        "Conexión rechazada por el servidor (verifica host y puerto)".into()
    } else if s.contains("server does not support TLS") {
        "El servidor no soporta TLS (usa SSLMODE=prefer o disable)".into()
    } else {
        format!("Error conectando a la base de datos: {}", s)
    }
}

/// Conecta respetando el timeout y la cancelación. La tarea de conexión se
/// lanza en segundo plano.
pub async fn connect(
    spec: &ConnectionSpec,
    cancel: &CancellationToken,
) -> Result<(Client, MakeTlsConnector), ConnectError> {
    let (config, tls) = build(spec).map_err(ConnectError::Failed)?;

    let fut = tokio::time::timeout(CONNECT_TIMEOUT, config.connect(tls.clone()));
    let result = tokio::select! {
        r = fut => r,
        _ = cancel.cancelled() => return Err(ConnectError::Cancelled),
    };

    match result {
        Ok(Ok((client, connection))) => {
            tokio::spawn(async move {
                if let Err(e) = connection.await {
                    eprintln!("[execution] error en el stream de conexión: {}", e);
                }
            });
            Ok((client, tls))
        }
        Ok(Err(e)) => Err(ConnectError::Failed(friendly_error(&e))),
        Err(_) => Err(ConnectError::Failed(format!(
            "Tiempo de espera agotado al conectar (> {}s)",
            CONNECT_TIMEOUT.as_secs()
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn spec() -> ConnectionSpec {
        ConnectionSpec {
            id: "t1".into(),
            db_type: None,
            host: Some("db.example.com".into()),
            db: Some("tenant".into()),
            schema: None,
            user: Some("admin".into()),
            password: Some("pa ss'word=1".into()),
            port: Some(5433),
            sslmode: None,
        }
    }

    #[test]
    fn password_with_spaces_and_quotes_is_preserved() {
        let (config, _) = build(&spec()).unwrap();
        assert_eq!(config.get_password(), Some("pa ss'word=1".as_bytes()));
        assert_eq!(config.get_ports(), &[5433]);
        assert_eq!(config.get_ssl_mode(), SslMode::Prefer);
    }

    #[test]
    fn sslmode_parsing() {
        assert_eq!(parse_sslmode(Some("DISABLE")).unwrap(), Ssl::Disable);
        assert_eq!(parse_sslmode(Some("verify-full")).unwrap(), Ssl::VerifyFull);
        assert!(parse_sslmode(Some("nope")).is_err());
    }

    #[test]
    fn type_validation() {
        let mut s = spec();
        assert!(validate_type(&s).is_ok());
        s.db_type = Some("PostgreSQL".into());
        assert!(validate_type(&s).is_ok());
        s.db_type = Some("mysql".into());
        assert!(validate_type(&s).is_err());
    }

    #[test]
    fn debug_hides_password() {
        let out = format!("{:?}", spec());
        assert!(!out.contains("pa ss'word"));
    }
}
