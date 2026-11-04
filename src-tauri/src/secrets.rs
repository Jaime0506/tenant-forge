//! Almacenamiento de contraseñas en el keychain del sistema operativo
//! (Windows Credential Manager, macOS Keychain, Secret Service en Linux).
//!
//! En la base SQLite local solo queda la marca `passwordInKeychain: true`.

use serde_json::{Map, Value};

const SERVICE: &str = "tenant-forge";
const FLAG: &str = "passwordInKeychain";

#[derive(Debug, Default)]
pub struct StoreOutcome {
    /// Se movió al menos una contraseña al keychain.
    pub migrated: bool,
    /// Alguna contraseña no pudo guardarse y quedó en texto plano.
    pub insecure: bool,
}

fn account(project_id: i64, obj: &Map<String, Value>) -> Option<String> {
    let key = obj
        .get("envKey")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .or_else(|| obj.get("id").and_then(Value::as_str))?;
    Some(format!("project:{}:{}", project_id, key))
}

fn entry(account: &str) -> keyring::Result<keyring::Entry> {
    keyring::Entry::new(SERVICE, account)
}

/// Mueve al keychain las contraseñas en claro de `list`.
/// Si `prune` es true, borra del keychain las entradas de conexiones que ya no
/// tienen contraseña (el usuario la quitó del .env).
pub fn store_passwords(project_id: i64, list: &mut [Value]) -> StoreOutcome {
    store_passwords_inner(project_id, list, false)
}

pub fn store_passwords_pruning(project_id: i64, list: &mut [Value]) -> StoreOutcome {
    store_passwords_inner(project_id, list, true)
}

fn store_passwords_inner(project_id: i64, list: &mut [Value], prune: bool) -> StoreOutcome {
    let mut outcome = StoreOutcome::default();

    for item in list.iter_mut() {
        let Some(obj) = item.as_object_mut() else { continue };
        let Some(acct) = account(project_id, obj) else { continue };

        let password = obj
            .get("password")
            .and_then(Value::as_str)
            .filter(|p| !p.is_empty())
            .map(str::to_owned);

        match password {
            Some(pw) => match entry(&acct).and_then(|e| e.set_password(&pw)) {
                Ok(()) => {
                    obj.remove("password");
                    obj.insert(FLAG.to_string(), Value::Bool(true));
                    outcome.migrated = true;
                }
                Err(e) => {
                    eprintln!("[secrets] keychain no disponible ({}): se conserva en la base local", e);
                    obj.remove(FLAG);
                    outcome.insecure = true;
                }
            },
            None if prune => {
                if obj.remove(FLAG).is_some() {
                    if let Ok(e) = entry(&acct) {
                        let _ = e.delete_credential();
                    }
                }
            }
            None => {}
        }
    }

    outcome
}

/// Inserta en `list` las contraseñas guardadas en el keychain.
pub fn load_passwords(project_id: i64, list: &mut [Value]) {
    for item in list.iter_mut() {
        let Some(obj) = item.as_object_mut() else { continue };
        if obj.get(FLAG).and_then(Value::as_bool) != Some(true) {
            continue;
        }
        let Some(acct) = account(project_id, obj) else { continue };
        match entry(&acct).and_then(|e| e.get_password()) {
            Ok(pw) => {
                obj.insert("password".to_string(), Value::String(pw));
            }
            Err(e) => eprintln!("[secrets] no se pudo leer la contraseña de {}: {}", acct, e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn account_prefers_env_key_over_id() {
        let v = json!({"id": "db1", "envKey": "TENANT_1"});
        assert_eq!(
            account(7, v.as_object().unwrap()).as_deref(),
            Some("project:7:TENANT_1")
        );
        let v = json!({"id": "db1"});
        assert_eq!(account(7, v.as_object().unwrap()).as_deref(), Some("project:7:db1"));
    }

    #[test]
    fn store_with_mock_keychain_strips_password() {
        keyring::set_default_credential_builder(keyring::mock::default_credential_builder());
        let mut list = vec![json!({"id": "db1", "password": "s3cr3t"}), json!({"id": "db2"})];
        let outcome = store_passwords(1, &mut list);
        assert!(outcome.migrated);
        assert!(!outcome.insecure);
        assert!(list[0].get("password").is_none());
        assert_eq!(list[0][FLAG], json!(true));
        assert!(list[1].get(FLAG).is_none());
    }

    /// Usa el keychain real del SO. Ejecutar aislado (el test con mock cambia el
    /// builder global): TF_KEYCHAIN_TEST=1 cargo test real_keychain_roundtrip
    #[test]
    fn real_keychain_roundtrip() {
        if std::env::var("TF_KEYCHAIN_TEST").as_deref() != Ok("1") {
            return;
        }
        let pid = -424242;
        let mut list = vec![json!({"id": "db", "envKey": "TF_TEST", "password": "pa ss'w"})];
        let outcome = store_passwords(pid, &mut list);
        assert!(outcome.migrated && !outcome.insecure);
        assert!(list[0].get("password").is_none());

        load_passwords(pid, &mut list);
        assert_eq!(list[0]["password"], json!("pa ss'w"));

        // Sin contraseña + prune => se borra la entrada
        list[0].as_object_mut().unwrap().remove("password");
        store_passwords_pruning(pid, &mut list);
        assert!(entry("project:-424242:TF_TEST").unwrap().get_password().is_err());
    }
}
