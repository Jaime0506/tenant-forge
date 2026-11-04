// Tipos para las conexiones de base de datos
export interface DatabaseConnection {
    id: string; // Identificador único (para UI y resultados; puede incluir puerto si hay duplicados)
    envKey?: string; // Sufijo en variables .env (ej: MY_CONNECTION en POSTGRES_DB_MY_CONNECTION)
    displayName?: string; // Nombre editable mostrado en chips y resultados
    type?: string;
    host?: string;
    db?: string;
    schema?: string;
    user?: string;
    password?: string;
    port?: number;
    /** disable | prefer | require | verify-full (por defecto prefer) */
    sslmode?: string;
    /** Grupo lógico del tenant (ej: prod, staging). Los tenants "prod" piden confirmación reforzada. */
    group?: string;
}

// Campos válidos para una conexión de base de datos
export const POSTGRES_FIELDS = [
    "TYPE",
    "HOST",
    "DB",
    "SCHEMA",
    "USER",
    "PASSWORD",
    "PORT",
    "SSLMODE",
    "GROUP",
] as const;
type PostgresField = (typeof POSTGRES_FIELDS)[number];

// Más largos primero para que la alternancia no corte nombres (no aplica hoy, pero evita sorpresas)
const LINE_REGEX = new RegExp(
    `^POSTGRES_(${[...POSTGRES_FIELDS].sort((a, b) => b.length - a.length).join("|")})_(.+?)\\s*=\\s*(.+)$`,
    "i"
);

// Comillas simples y dobles: ASCII y tipográficas (U+2018, U+2019, U+201C, U+201D)
const LEADING_QUOTES = /^['"‘’“”]+/;
const TRAILING_QUOTES = /['"‘’“”]+$/;

/**
 * Limpia todas las comillas (simples y dobles, normales y Unicode) del inicio y final de un string.
 * Acepta valores no-string (devuelve undefined para null/undefined).
 */
export function cleanQuotes(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    let cleaned = String(value).trim();
    for (let i = 0; i < 10; i++) {
        const before = cleaned;
        cleaned = cleaned.replace(LEADING_QUOTES, "").replace(TRAILING_QUOTES, "").trim();
        if (before === cleaned) break;
    }
    return cleaned;
}

function applyField(connection: DatabaseConnection, field: PostgresField, value: string) {
    switch (field) {
        case "TYPE":
            connection.type = value;
            break;
        case "HOST":
            connection.host = value;
            break;
        case "DB":
            connection.db = value;
            break;
        case "SCHEMA":
            connection.schema = value;
            break;
        case "USER":
            connection.user = value;
            break;
        case "PASSWORD":
            connection.password = value;
            break;
        case "PORT":
            connection.port = parseInt(value, 10) || undefined;
            break;
        case "SSLMODE":
            connection.sslmode = value.toLowerCase();
            break;
        case "GROUP":
            connection.group = value;
            break;
    }
}

/**
 * Parsea el contenido .env en conexiones.
 *
 * Cada conexión se identifica por el sufijo de sus variables (POSTGRES_{FIELD}_{SUFIJO}).
 * Dos conexiones con el mismo sufijo se separan cuando hay una línea en blanco entre ellas
 * o cuando un campo se repite (permite reutilizar el mismo sufijo en bloques distintos).
 */
export function getUniqueConnections(envContent: string): DatabaseConnection[] {
    const allConnections: DatabaseConnection[] = [];
    // Conexión abierta por sufijo dentro del bloque actual
    let open = new Map<string, { conn: DatabaseConnection; fields: Set<string> }>();

    const closeBlock = () => {
        open = new Map();
    };

    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) {
            closeBlock();
            continue;
        }
        if (trimmed.startsWith("#")) continue;

        const match = trimmed.match(LINE_REGEX);
        if (!match) continue;

        const [, rawField, rawKey, rawValue] = match;
        const field = rawField.toUpperCase() as PostgresField;
        const envKey = cleanQuotes(rawKey) ?? rawKey;
        const value = cleanQuotes(rawValue) ?? "";

        let entry = open.get(envKey.toUpperCase());
        if (!entry || entry.fields.has(field)) {
            entry = { conn: { id: "", envKey }, fields: new Set() };
            open.set(envKey.toUpperCase(), entry);
            allConnections.push(entry.conn);
        }
        entry.fields.add(field);
        applyField(entry.conn, field, value);
    }

    allConnections.forEach((conn, index) => {
        conn.id = conn.db || `${conn.envKey}_${index + 1}`;
    });

    // Desambiguar ids repetidos (mismo db, distinto puerto/host) para que cada chip sea identificable
    const idCount = new Map<string, number>();
    for (const conn of allConnections) {
        idCount.set(conn.id, (idCount.get(conn.id) ?? 0) + 1);
    }
    const usedIds = new Set<string>();
    for (const conn of allConnections) {
        if ((idCount.get(conn.id) ?? 0) <= 1) {
            usedIds.add(conn.id);
            continue;
        }
        let candidate = conn.id;
        if (conn.port != null) candidate = `${conn.id}_${conn.port}`;
        if (usedIds.has(candidate) && (conn.host || conn.port != null)) {
            candidate = `${conn.id}_${conn.host ?? "host"}_${conn.port ?? ""}`;
        }
        if (usedIds.has(candidate) && conn.schema) {
            candidate = `${conn.id}_${conn.schema}`;
        }
        let suffix = 0;
        while (usedIds.has(candidate)) {
            suffix++;
            candidate = `${conn.id}_${suffix}`;
        }
        conn.id = candidate;
        usedIds.add(conn.id);
    }

    return allConnections;
}

/**
 * Convierte un array de conexiones de base de datos a formato .env
 */
export function serializeEnvConnections(connections: DatabaseConnection[]): string {
    return connections
        .filter((conn): conn is DatabaseConnection => conn != null && typeof conn === "object")
        .map((conn, index) => {
            const raw = conn.envKey ?? conn.id ?? "";
            const suffix =
                (typeof raw === "string" ? raw : String(raw)).toUpperCase() || `CONNECTION_${index + 1}`;
            const lines: string[] = [];
            if (conn.type) lines.push(`POSTGRES_TYPE_${suffix} = "${conn.type}"`);
            if (conn.host) lines.push(`POSTGRES_HOST_${suffix} = "${conn.host}"`);
            if (conn.db) lines.push(`POSTGRES_DB_${suffix} = "${conn.db}"`);
            if (conn.schema) lines.push(`POSTGRES_SCHEMA_${suffix} = "${conn.schema}"`);
            if (conn.user) lines.push(`POSTGRES_USER_${suffix} = "${conn.user}"`);
            if (conn.password) lines.push(`POSTGRES_PASSWORD_${suffix} = "${conn.password}"`);
            if (conn.port) lines.push(`POSTGRES_PORT_${suffix} = ${conn.port}`);
            if (conn.sslmode) lines.push(`POSTGRES_SSLMODE_${suffix} = "${conn.sslmode}"`);
            if (conn.group) lines.push(`POSTGRES_GROUP_${suffix} = "${conn.group}"`);
            return lines.join("\n");
        })
        .join("\n\n");
}

/** Conexión lista para enviarse al backend (sin comillas residuales). */
export function sanitizeConnection(connection: DatabaseConnection): DatabaseConnection {
    return {
        id: cleanQuotes(connection.id) || connection.id,
        envKey: connection.envKey,
        displayName: connection.displayName,
        type: cleanQuotes(connection.type),
        host: cleanQuotes(connection.host),
        db: cleanQuotes(connection.db),
        schema: cleanQuotes(connection.schema),
        user: cleanQuotes(connection.user),
        password: cleanQuotes(connection.password),
        port: connection.port,
        sslmode: cleanQuotes(connection.sslmode),
        group: cleanQuotes(connection.group),
    };
}
