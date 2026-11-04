use serde::{Deserialize, Serialize};

/// Conexión tal como llega del frontend (campos extra como envKey o
/// displayName se ignoran).
#[derive(Deserialize, Clone)]
pub struct ConnectionSpec {
    pub id: String,
    #[serde(rename = "type", default)]
    pub db_type: Option<String>,
    #[serde(default)]
    pub host: Option<String>,
    #[serde(default)]
    pub db: Option<String>,
    #[serde(default)]
    pub schema: Option<String>,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub password: Option<String>,
    #[serde(default)]
    pub port: Option<u16>,
    #[serde(default)]
    pub sslmode: Option<String>,
}

impl std::fmt::Debug for ConnectionSpec {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ConnectionSpec")
            .field("id", &self.id)
            .field("type", &self.db_type)
            .field("host", &self.host)
            .field("db", &self.db)
            .field("schema", &self.schema)
            .field("user", &self.user)
            .field("password", &self.password.as_ref().map(|_| "***"))
            .field("port", &self.port)
            .field("sslmode", &self.sslmode)
            .finish()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionMode {
    /// Commit solo si todos los tenants terminan bien; si no, rollback en todos.
    AllOrNothing,
    /// Cada tenant hace commit por su cuenta (comportamiento clásico).
    #[default]
    Independent,
    /// Ejecuta y siempre hace rollback.
    DryRun,
}

impl ExecutionMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            ExecutionMode::AllOrNothing => "all_or_nothing",
            ExecutionMode::Independent => "independent",
            ExecutionMode::DryRun => "dry_run",
        }
    }
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionOptions {
    pub execution_id: String,
    #[serde(default)]
    pub project_id: Option<i64>,
    #[serde(default)]
    pub mode: ExecutionMode,
    #[serde(default)]
    pub concurrency: Option<usize>,
    #[serde(default)]
    pub statement_timeout_ms: Option<u64>,
    #[serde(default)]
    pub lock_timeout_ms: Option<u64>,
    #[serde(default)]
    pub max_rows: Option<usize>,
    /// Registrar el script en `_tenant_forge_migrations` de cada tenant.
    #[serde(default = "default_true")]
    pub track_migration: bool,
    /// Ejecutar aunque el script ya esté registrado como aplicado.
    #[serde(default)]
    pub force: bool,
    #[serde(default)]
    pub script_name: Option<String>,
}

impl ExecutionOptions {
    pub fn concurrency(&self) -> usize {
        self.concurrency.unwrap_or(12).clamp(1, 50)
    }
    pub fn max_rows(&self) -> usize {
        self.max_rows.unwrap_or(500).clamp(1, 10_000)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TenantStatus {
    Committed,
    RolledBack,
    Failed,
    Skipped,
    Cancelled,
}

impl TenantStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TenantStatus::Committed => "committed",
            TenantStatus::RolledBack => "rolled_back",
            TenantStatus::Failed => "failed",
            TenantStatus::Skipped => "skipped",
            TenantStatus::Cancelled => "cancelled",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ResultSet {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<Option<String>>>,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct TenantResult {
    pub connection_id: String,
    pub success: bool,
    pub message: String,
    pub status: TenantStatus,
    pub duration_ms: u64,
    pub rows_affected: Option<u64>,
    pub result_sets: Vec<ResultSet>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhaseEvent {
    pub execution_id: String,
    /// running | deciding | committing | rolling_back | done
    pub phase: &'static str,
}
