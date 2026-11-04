//! Análisis léxico mínimo de SQL (Postgres): elimina comentarios y literales
//! para poder inspeccionar las sentencias sin falsos positivos.

use sha2::{Digest, Sha256};

#[derive(Debug, Default, PartialEq, Eq)]
pub struct SqlAnalysis {
    /// Contiene sentencias que Postgres no permite dentro de una transacción.
    pub non_transactional: bool,
    /// Contiene BEGIN/COMMIT/ROLLBACK propios.
    pub controls_transaction: bool,
    /// Todas las sentencias son de solo lectura.
    pub read_only: bool,
    pub statement_count: usize,
}

/// Devuelve el SQL con comentarios, strings, identificadores entre comillas y
/// bloques `$tag$...$tag$` reemplazados por espacios.
pub fn strip_literals(sql: &str) -> String {
    let chars: Vec<char> = sql.chars().collect();
    let mut out = String::with_capacity(sql.len());
    let mut i = 0;
    let n = chars.len();

    while i < n {
        let c = chars[i];
        let next = chars.get(i + 1).copied();

        // Comentario de línea
        if c == '-' && next == Some('-') {
            while i < n && chars[i] != '\n' {
                i += 1;
            }
            out.push(' ');
            continue;
        }
        // Comentario de bloque (anidable en Postgres)
        if c == '/' && next == Some('*') {
            let mut depth = 0;
            while i < n {
                if chars[i] == '/' && chars.get(i + 1) == Some(&'*') {
                    depth += 1;
                    i += 2;
                } else if chars[i] == '*' && chars.get(i + 1) == Some(&'/') {
                    depth -= 1;
                    i += 2;
                    if depth == 0 {
                        break;
                    }
                } else {
                    i += 1;
                }
            }
            out.push(' ');
            continue;
        }
        // Strings '...' (incluye E'...' con escapes \')
        if c == '\'' {
            let escapes = i > 0 && matches!(chars[i - 1], 'E' | 'e');
            i += 1;
            while i < n {
                if escapes && chars[i] == '\\' {
                    i += 2;
                    continue;
                }
                if chars[i] == '\'' {
                    if chars.get(i + 1) == Some(&'\'') {
                        i += 2;
                        continue;
                    }
                    i += 1;
                    break;
                }
                i += 1;
            }
            out.push(' ');
            continue;
        }
        // Identificadores "..."
        if c == '"' {
            i += 1;
            while i < n {
                if chars[i] == '"' {
                    if chars.get(i + 1) == Some(&'"') {
                        i += 2;
                        continue;
                    }
                    i += 1;
                    break;
                }
                i += 1;
            }
            out.push(' ');
            continue;
        }
        // Dollar quoting: $$...$$ o $tag$...$tag$
        if c == '$' {
            let mut j = i + 1;
            while j < n && (chars[j].is_alphanumeric() || chars[j] == '_') {
                j += 1;
            }
            let is_tag = j < n
                && chars[j] == '$'
                && !(i > 0 && (chars[i - 1].is_alphanumeric() || chars[i - 1] == '_'))
                && !chars[i + 1..j].first().is_some_and(|c| c.is_ascii_digit());
            if is_tag {
                let tag: String = chars[i..=j].iter().collect();
                let tag_chars: Vec<char> = tag.chars().collect();
                i = j + 1;
                while i < n {
                    if chars[i..].starts_with(&tag_chars) {
                        i += tag_chars.len();
                        break;
                    }
                    i += 1;
                }
                out.push(' ');
                continue;
            }
        }

        out.push(c);
        i += 1;
    }

    out
}

/// Divide el SQL (ya sin literales) en sentencias normalizadas en mayúsculas.
fn statements(code: &str) -> Vec<String> {
    code.split(';')
        .map(|s| s.split_whitespace().collect::<Vec<_>>().join(" ").to_uppercase())
        .filter(|s| !s.is_empty())
        .collect()
}

fn first_word(stmt: &str) -> &str {
    stmt.split(|c: char| !c.is_alphanumeric() && c != '_')
        .find(|w| !w.is_empty())
        .unwrap_or("")
}

fn has_word(stmt: &str, word: &str) -> bool {
    stmt.split(|c: char| !c.is_alphanumeric() && c != '_')
        .any(|w| w == word)
}

pub fn analyze(sql: &str) -> SqlAnalysis {
    let code = strip_literals(sql);
    let stmts = statements(&code);

    let non_transactional = stmts.iter().any(|s| {
        s.starts_with("VACUUM")
            || s.starts_with("CREATE DATABASE")
            || s.starts_with("DROP DATABASE")
            || s.starts_with("ALTER SYSTEM")
            || s.starts_with("CREATE TABLESPACE")
            || s.starts_with("DROP TABLESPACE")
            || s.starts_with("CREATE SUBSCRIPTION")
            || s.starts_with("DROP SUBSCRIPTION")
            || ((s.starts_with("CREATE") || s.starts_with("DROP") || s.starts_with("REINDEX"))
                && has_word(s, "CONCURRENTLY"))
    });

    // `PREPARE nombre AS ...` no controla transacciones; `PREPARE TRANSACTION` sí.
    let controls_transaction = stmts.iter().any(|s| {
        matches!(first_word(s), "BEGIN" | "COMMIT" | "ROLLBACK" | "END" | "ABORT")
            || s.starts_with("START TRANSACTION")
            || s.starts_with("PREPARE TRANSACTION")
    });

    let read_only = !stmts.is_empty()
        && stmts.iter().all(|s| match first_word(s) {
            "SELECT" | "SHOW" | "EXPLAIN" | "VALUES" | "TABLE" => !has_word(s, "INTO"),
            "WITH" => !["INSERT", "UPDATE", "DELETE", "MERGE", "INTO"]
                .iter()
                .any(|w| has_word(s, w)),
            _ => false,
        });

    SqlAnalysis {
        non_transactional,
        controls_transaction,
        read_only,
        statement_count: stmts.len(),
    }
}

/// SHA-256 del script normalizado (fin de línea `\n` y sin espacios extremos).
pub fn script_hash(sql: &str) -> String {
    let normalized = sql.replace("\r\n", "\n");
    let digest = Sha256::digest(normalized.trim().as_bytes());
    digest.iter().map(|b| format!("{:02x}", b)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ignores_keywords_inside_strings_and_comments() {
        let a = analyze("INSERT INTO t VALUES ('CREATE INDEX CONCURRENTLY; BEGIN'); -- VACUUM");
        assert!(!a.non_transactional);
        assert!(!a.controls_transaction);
        assert_eq!(a.statement_count, 1);
    }

    #[test]
    fn ignores_begin_inside_function_body() {
        let a = analyze(
            "CREATE OR REPLACE FUNCTION f() RETURNS void AS $fn$ BEGIN PERFORM 1; END; $fn$ LANGUAGE plpgsql;",
        );
        assert!(!a.controls_transaction);
        assert_eq!(a.statement_count, 1);
    }

    #[test]
    fn detects_non_transactional_statements() {
        assert!(analyze("CREATE INDEX CONCURRENTLY i ON t(a);").non_transactional);
        assert!(analyze("vacuum analyze t").non_transactional);
        assert!(!analyze("CREATE INDEX i ON t(a);").non_transactional);
    }

    #[test]
    fn detects_transaction_control() {
        assert!(analyze("BEGIN; UPDATE t SET a = 1; COMMIT;").controls_transaction);
        assert!(analyze("start transaction; select 1").controls_transaction);
        assert!(!analyze("PREPARE q AS SELECT 1").controls_transaction);
    }

    #[test]
    fn detects_read_only() {
        assert!(analyze("SELECT * FROM users; SHOW search_path").read_only);
        assert!(analyze("WITH x AS (SELECT 1) SELECT * FROM x").read_only);
        assert!(!analyze("WITH x AS (DELETE FROM t RETURNING *) SELECT * FROM x").read_only);
        assert!(!analyze("SELECT * INTO copy FROM t").read_only);
        assert!(!analyze("UPDATE t SET a = 1").read_only);
        assert!(!analyze("-- solo comentario").read_only);
    }

    #[test]
    fn escaped_strings_and_quoted_identifiers() {
        let code = strip_literals(r#"SELECT E'it\'s; BEGIN', "we;ird" FROM t"#);
        assert!(!code.contains(';'));
        assert!(!code.contains("BEGIN"));
    }

    #[test]
    fn hash_ignores_line_endings_and_outer_whitespace() {
        assert_eq!(script_hash("SELECT 1;\r\nSELECT 2;\n"), script_hash("  SELECT 1;\nSELECT 2;"));
        assert_ne!(script_hash("SELECT 1"), script_hash("SELECT 2"));
    }
}
