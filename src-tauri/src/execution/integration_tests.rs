//! Tests contra Postgres real. Requieren `docker compose up -d` y se activan con
//! `TF_PG_TESTS=1 cargo test`. Usan tenant_forge_1 y tenant_forge_2 (puerto 5432)
//! y tenant_forge_3 (puerto 5433), cada uno con un schema propio por test.
//! Puertos configurables con TF_PG_PORT_MAIN / TF_PG_PORT_3 y host con TF_PG_HOST.

use super::analysis;
use super::types::{ConnectionSpec, ExecutionMode, ExecutionOptions, TenantResult, TenantStatus};
use super::{connect, run_all};
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

fn enabled() -> bool {
    std::env::var("TF_PG_TESTS").map(|v| v == "1").unwrap_or(false)
}

fn tenant(db: &str, port: u16, schema: &str) -> ConnectionSpec {
    ConnectionSpec {
        id: format!("{}_{}", db, schema),
        db_type: Some("postgres".into()),
        host: Some(std::env::var("TF_PG_HOST").unwrap_or_else(|_| "localhost".into())),
        db: Some(db.into()),
        schema: Some(schema.into()),
        user: Some("admin".into()),
        password: Some("admin123".into()),
        port: Some(port),
        sslmode: Some("prefer".into()),
    }
}

fn tenants(schema: &str) -> Vec<ConnectionSpec> {
    let port = |var: &str, default: u16| -> u16 {
        std::env::var(var).ok().and_then(|p| p.parse().ok()).unwrap_or(default)
    };
    let main = port("TF_PG_PORT_MAIN", 5432);
    let port3 = port("TF_PG_PORT_3", 5433);
    vec![
        tenant("tenant_forge_1", main, schema),
        tenant("tenant_forge_2", main, schema),
        tenant("tenant_forge_3", port3, schema),
    ]
}

fn opts(mode: ExecutionMode) -> ExecutionOptions {
    let mut o: ExecutionOptions = serde_json::from_value(serde_json::json!({ "executionId": "test" })).unwrap();
    o.mode = mode;
    o
}

async fn run(sql: &str, specs: Vec<ConnectionSpec>, o: ExecutionOptions, cancel: CancellationToken) -> Vec<TenantResult> {
    let (tx, mut rx) = mpsc::channel(64);
    tokio::spawn(async move { while rx.recv().await.is_some() {} });
    run_all(sql, o, analysis::analyze(sql), cancel, "test".into(), specs, tx, |_| {}).await
}

async fn simple(sql: &str, specs: &[ConnectionSpec]) -> Vec<TenantResult> {
    let mut o = opts(ExecutionMode::Independent);
    o.track_migration = false;
    run(sql, specs.to_vec(), o, CancellationToken::new()).await
}

/// Crea un schema limpio en cada tenant y devuelve las conexiones apuntando a él.
async fn fresh_schema(name: &str) -> Vec<ConnectionSpec> {
    let base = tenants("public");
    let sql = format!("DROP SCHEMA IF EXISTS {n} CASCADE; CREATE SCHEMA {n};", n = name);
    for r in simple(&sql, &base).await {
        assert!(r.success, "no se pudo preparar el schema: {}", r.message);
    }
    tenants(name)
}

async fn table_exists(specs: &[ConnectionSpec], schema: &str, table: &str) -> Vec<bool> {
    let mut out = vec![];
    for spec in specs {
        let (client, _) = match connect::connect(spec, &CancellationToken::new()).await {
            Ok(c) => c,
            Err(_) => panic!("sin conexión a {}", spec.id),
        };
        let qualified = format!("{}.{}", schema, table);
        let exists: bool = client
            .query_one("SELECT to_regclass($1) IS NOT NULL", &[&qualified])
            .await
            .unwrap()
            .get(0);
        out.push(exists);
    }
    out
}

#[tokio::test]
async fn all_or_nothing_rolls_back_everywhere_when_one_tenant_fails() {
    if !enabled() {
        return;
    }
    let specs = fresh_schema("tf_aon").await;
    // Provocar el fallo solo en el tenant 3: la tabla ya existe con otro tipo
    simple("CREATE TABLE tf_aon.items (id text)", &specs[2..]).await;

    let sql = "CREATE TABLE items (id int PRIMARY KEY); INSERT INTO items VALUES (1);";
    let results = run(sql, specs.clone(), opts(ExecutionMode::AllOrNothing), CancellationToken::new()).await;

    let failed: Vec<_> = results.iter().filter(|r| r.status == TenantStatus::Failed).collect();
    assert_eq!(failed.len(), 1, "{:#?}", results);
    assert!(results.iter().filter(|r| r.status != TenantStatus::Failed).all(|r| r.status == TenantStatus::RolledBack));
    // Los tenants 1 y 2 no deben tener la tabla
    assert_eq!(table_exists(&specs[..2], "tf_aon", "items").await, vec![false, false]);
}

#[tokio::test]
async fn all_or_nothing_commits_when_everything_succeeds_and_then_skips() {
    if !enabled() {
        return;
    }
    let specs = fresh_schema("tf_ok").await;
    let sql = "CREATE TABLE things (id int); INSERT INTO things VALUES (1), (2);";

    let results = run(sql, specs.clone(), opts(ExecutionMode::AllOrNothing), CancellationToken::new()).await;
    assert!(results.iter().all(|r| r.status == TenantStatus::Committed), "{:#?}", results);
    assert!(results.iter().all(|r| r.rows_affected == Some(2)));
    assert_eq!(table_exists(&specs, "tf_ok", "things").await, vec![true; 3]);
    assert_eq!(table_exists(&specs, "tf_ok", "_tenant_forge_migrations").await, vec![true; 3]);

    // Segunda vez: ya aplicado → omitido
    let again = run(sql, specs.clone(), opts(ExecutionMode::Independent), CancellationToken::new()).await;
    assert!(again.iter().all(|r| r.status == TenantStatus::Skipped), "{:#?}", again);

    // Con force se re-ejecuta (y falla porque la tabla existe)
    let mut forced = opts(ExecutionMode::Independent);
    forced.force = true;
    let forced = run(sql, specs.clone(), forced, CancellationToken::new()).await;
    assert!(forced.iter().all(|r| r.status == TenantStatus::Failed));
}

#[tokio::test]
async fn dry_run_persists_nothing() {
    if !enabled() {
        return;
    }
    let specs = fresh_schema("tf_dry").await;
    let results = run("CREATE TABLE ghost (id int)", specs.clone(), opts(ExecutionMode::DryRun), CancellationToken::new()).await;
    assert!(results.iter().all(|r| r.status == TenantStatus::RolledBack && r.success), "{:#?}", results);
    assert_eq!(table_exists(&specs, "tf_dry", "ghost").await, vec![false; 3]);
    assert_eq!(table_exists(&specs, "tf_dry", "_tenant_forge_migrations").await, vec![false; 3]);
}

#[tokio::test]
async fn select_returns_rows() {
    if !enabled() {
        return;
    }
    let specs = tenants("public");
    let results = simple("SELECT 1 AS a, 'x' AS b UNION ALL SELECT 2, NULL ORDER BY a", &specs).await;
    for r in &results {
        assert!(r.success, "{}", r.message);
        let set = &r.result_sets[0];
        assert_eq!(set.columns, vec!["a", "b"]);
        assert_eq!(set.rows, vec![vec![Some("1".into()), Some("x".into())], vec![Some("2".into()), None]]);
    }
}

#[tokio::test]
async fn cancel_interrupts_running_queries() {
    if !enabled() {
        return;
    }
    let specs = tenants("public");
    let cancel = CancellationToken::new();
    let c2 = cancel.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(800)).await;
        c2.cancel();
    });
    let mut o = opts(ExecutionMode::Independent);
    o.track_migration = false;
    let started = std::time::Instant::now();
    let results = run("SELECT pg_sleep(30)", specs, o, cancel).await;
    assert!(started.elapsed() < Duration::from_secs(5));
    assert!(results.iter().all(|r| r.status == TenantStatus::Cancelled), "{:#?}", results);
}

#[tokio::test]
async fn statement_timeout_is_enforced() {
    if !enabled() {
        return;
    }
    let mut o = opts(ExecutionMode::Independent);
    o.track_migration = false;
    o.statement_timeout_ms = Some(300);
    let results = run("SELECT pg_sleep(5)", tenants("public")[..1].to_vec(), o, CancellationToken::new()).await;
    assert_eq!(results[0].status, TenantStatus::Failed);
    assert!(results[0].message.contains("57014"), "{}", results[0].message);
}

#[tokio::test]
async fn unreachable_tenant_fails_without_blocking_others() {
    if !enabled() {
        return;
    }
    let mut specs = tenants("public");
    specs.push(tenant("tenant_forge_1", 1, "public"));
    let results = simple("SELECT 1", &specs).await;
    assert_eq!(results.iter().filter(|r| r.success).count(), 3);
    assert_eq!(results[3].status, TenantStatus::Failed);
}

#[tokio::test]
async fn non_transactional_statement_runs_in_independent_mode() {
    if !enabled() {
        return;
    }
    let specs = fresh_schema("tf_conc").await;
    simple("CREATE TABLE t (a int)", &specs).await;
    let results = simple("CREATE INDEX CONCURRENTLY t_a_idx ON t (a)", &specs).await;
    assert!(results.iter().all(|r| r.success), "{:#?}", results);
}
