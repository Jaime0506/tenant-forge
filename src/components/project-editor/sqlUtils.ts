/**
 * Función para formatear SQL básico
 */
export function formatSql(sql: string): string {
    let formatted = sql
        .replace(/\s+/g, " ")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s*\(\s*/g, " (")
        .replace(/\s*\)\s*/g, ") ")
        .trim();

    // Agregar saltos de línea después de palabras clave importantes
    const keywordsWithNewline = [
        "SELECT",
        "FROM",
        "WHERE",
        "JOIN",
        "ORDER BY",
        "GROUP BY",
        "HAVING",
        "INSERT",
        "UPDATE",
        "DELETE",
    ];

    keywordsWithNewline.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        formatted = formatted.replace(regex, `\n${keyword}`);
    });

    formatted = formatted.replace(/\n\n+/g, "\n").trim();
    return formatted;
}

/**
 * Reemplaza comentarios, strings, identificadores entre comillas y bloques
 * $tag$...$tag$ por espacios para analizar el SQL sin falsos positivos.
 * (Equivalente a `strip_literals` del backend.)
 */
export function stripSqlLiterals(sql: string): string {
    let out = "";
    let i = 0;
    const n = sql.length;

    while (i < n) {
        const c = sql[i];
        const next = sql[i + 1];

        if (c === "-" && next === "-") {
            while (i < n && sql[i] !== "\n") i++;
            out += " ";
            continue;
        }
        if (c === "/" && next === "*") {
            let depth = 0;
            while (i < n) {
                if (sql[i] === "/" && sql[i + 1] === "*") {
                    depth++;
                    i += 2;
                } else if (sql[i] === "*" && sql[i + 1] === "/") {
                    depth--;
                    i += 2;
                    if (depth === 0) break;
                } else {
                    i++;
                }
            }
            out += " ";
            continue;
        }
        if (c === "'") {
            const escapes = i > 0 && /[Ee]/.test(sql[i - 1]);
            i++;
            while (i < n) {
                if (escapes && sql[i] === "\\") {
                    i += 2;
                    continue;
                }
                if (sql[i] === "'") {
                    if (sql[i + 1] === "'") {
                        i += 2;
                        continue;
                    }
                    i++;
                    break;
                }
                i++;
            }
            out += " ";
            continue;
        }
        if (c === '"') {
            i++;
            while (i < n) {
                if (sql[i] === '"') {
                    if (sql[i + 1] === '"') {
                        i += 2;
                        continue;
                    }
                    i++;
                    break;
                }
                i++;
            }
            out += " ";
            continue;
        }
        if (c === "$") {
            const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
            const prevIsWord = i > 0 && /[A-Za-z0-9_]/.test(sql[i - 1]);
            if (m && !prevIsWord) {
                const tag = m[0];
                const end = sql.indexOf(tag, i + tag.length);
                i = end === -1 ? n : end + tag.length;
                out += " ";
                continue;
            }
        }

        out += c;
        i++;
    }
    return out;
}

/** Divide el SQL en sentencias normalizadas (mayúsculas, espacios simples). */
export function splitStatements(sql: string): string[] {
    return stripSqlLiterals(sql)
        .split(";")
        .map((s) => s.replace(/\s+/g, " ").trim().toUpperCase())
        .filter(Boolean);
}

export interface DestructiveFinding {
    kind: "DROP" | "TRUNCATE" | "DELETE_ALL" | "UPDATE_ALL" | "ALTER_DROP";
    /** Descripción corta para mostrar al usuario */
    label: string;
}

/**
 * Detecta operaciones destructivas: DROP, TRUNCATE, ALTER ... DROP,
 * y DELETE/UPDATE sin WHERE.
 */
export function analyzeSql(sql: string): { destructive: DestructiveFinding[]; readOnly: boolean } {
    const statements = splitStatements(sql);
    const destructive: DestructiveFinding[] = [];

    for (const s of statements) {
        const short = s.length > 80 ? `${s.slice(0, 77)}...` : s;
        if (/^DROP\b/.test(s)) {
            destructive.push({ kind: "DROP", label: short });
        } else if (/^TRUNCATE\b/.test(s)) {
            destructive.push({ kind: "TRUNCATE", label: short });
        } else if (/^ALTER\b.*\bDROP\b/.test(s)) {
            destructive.push({ kind: "ALTER_DROP", label: short });
        } else if (/^(WITH\b.*\b)?DELETE\b/.test(s) && !/\bWHERE\b/.test(s)) {
            destructive.push({ kind: "DELETE_ALL", label: `${short} (sin WHERE)` });
        } else if (/^(WITH\b.*\b)?UPDATE\b/.test(s) && !/\bWHERE\b/.test(s)) {
            destructive.push({ kind: "UPDATE_ALL", label: `${short} (sin WHERE)` });
        }
    }

    const readOnly =
        statements.length > 0 &&
        statements.every((s) => {
            if (/^(SELECT|SHOW|EXPLAIN|VALUES|TABLE)\b/.test(s)) return !/\bINTO\b/.test(s);
            if (/^WITH\b/.test(s)) return !/\b(INSERT|UPDATE|DELETE|MERGE|INTO)\b/.test(s);
            return false;
        });

    return { destructive, readOnly };
}
