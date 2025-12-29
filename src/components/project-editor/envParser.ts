// Tipos para las conexiones de base de datos
export interface DatabaseConnection {
    id: string; // Identificador único de la conexión (ej: HIPOTECARIA_GESEL_SALVADOR)
    type?: string;
    host?: string;
    db?: string;
    schema?: string;
    user?: string;
    password?: string;
    port?: number;
}

// Campos válidos para una conexión de base de datos
const POSTGRES_FIELDS = [
    "TYPE",
    "HOST",
    "DB",
    "SCHEMA",
    "USER",
    "PASSWORD",
    "PORT",
] as const;
type PostgresField = (typeof POSTGRES_FIELDS)[number];

/**
 * Limpia todas las comillas (simples y dobles, normales y Unicode) del inicio y final de un string
 * Itera hasta que no haya más cambios para manejar comillas anidadas
 */
function cleanQuotes(value: string): string {
    if (!value) return value;

    let cleaned = value.trim();
    let iterations = 0;
    const maxIterations = 10; // Límite de seguridad

    // Iterar hasta que no haya más cambios
    while (iterations < maxIterations) {
        const before = cleaned;

        // Eliminar todas las variantes de comillas simples del inicio y final
        // Incluye: ' (normal), ' (left single U+2018), ' (right single U+2019)
        cleaned = cleaned.replace(/^['''']+/g, "").replace(/['''']+$/g, "");

        // Eliminar todas las variantes de comillas dobles del inicio y final
        // Incluye: " (normal), " (left double U+201C), " (right double U+201D)
        cleaned = cleaned.replace(/^[""""]+/g, "").replace(/[""""]+$/g, "");

        // Si no hubo cambios, salir
        if (before === cleaned) {
            break;
        }

        iterations++;
    }

    return cleaned.trim();
}

/**
 * Parsea el contenido de un archivo .env y agrupa las conexiones de base de datos
 * El patrón esperado es: POSTGRES_{FIELD}_{CONNECTION_ID} = 'valor'
 */
export function parseEnvConnections(envContent: string): DatabaseConnection[] {
    const connections = new Map<string, DatabaseConnection>();

    // Dividir por líneas
    const lines = envContent.split("\n");

    for (const line of lines) {
        // Ignorar líneas vacías o comentarios
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue;
        }

        // Buscar el patrón POSTGRES_{FIELD}_{CONNECTION_ID} = valor
        const match = trimmedLine.match(
            /^POSTGRES_(TYPE|HOST|DB|SCHEMA|USER|PASSWORD|PORT)_(.+?)\s*=\s*(.+)$/i
        );

        if (match) {
            const [, field, connectionId, rawValue] = match;
            const upperField = field.toUpperCase() as PostgresField;

            // Limpiar el valor usando la función helper
            const value = cleanQuotes(rawValue);

            // Obtener o crear la conexión
            if (!connections.has(connectionId)) {
                connections.set(connectionId, { id: connectionId });
            }

            const connection = connections.get(connectionId)!;

            // Asignar el valor al campo correspondiente
            switch (upperField) {
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
            }
        }
    }

    return Array.from(connections.values());
}

/**
 * Obtiene las conexiones únicas (basado en la combinación DB + SCHEMA)
 * ya que el mismo ID de conexión puede tener diferentes DBs
 */
export function getUniqueConnections(envContent: string): DatabaseConnection[] {
    const allConnections: DatabaseConnection[] = [];
    const lines = envContent.split("\n");

    // Agrupar líneas en bloques (separados por líneas vacías)
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            if (currentBlock.length > 0) {
                blocks.push(currentBlock);
                currentBlock = [];
            }
        } else if (!trimmedLine.startsWith("#")) {
            currentBlock.push(trimmedLine);
        }
    }
    if (currentBlock.length > 0) {
        blocks.push(currentBlock);
    }

    // Procesar cada bloque como una conexión independiente
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex];
        const connection: DatabaseConnection = { id: "" };
        let baseId = "";

        for (const line of block) {
            const match = line.match(
                /^POSTGRES_(TYPE|HOST|DB|SCHEMA|USER|PASSWORD|PORT)_(.+?)\s*=\s*(.+)$/i
            );

            if (match) {
                const [, field, connectionId, rawValue] = match;
                const upperField = field.toUpperCase();

                // Limpiar comillas usando la función helper
                const value = cleanQuotes(rawValue);

                if (!baseId) {
                    // Limpiar también el connectionId
                    baseId = cleanQuotes(connectionId);
                }

                switch (upperField) {
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
                }
            }
        }

        if (baseId) {
            // Limpiar el DB también antes de usarlo en el ID
            const cleanDb = connection.db ? cleanQuotes(connection.db) : "";

            // Crear un ID único basado solo en el DB para simplificar
            connection.id = cleanDb || `${baseId}_${blockIndex + 1}`;
            allConnections.push(connection);
        }
    }

    return allConnections;
}

/**
 * Convierte un array de conexiones de base de datos a formato .env
 */
export function serializeEnvConnections(
    connections: DatabaseConnection[]
): string {
    return connections
        .map((conn) => {
            const id = conn.id.toUpperCase();
            const lines: string[] = [];

            if (conn.type) lines.push(`POSTGRES_TYPE_${id} = "${conn.type}"`);
            if (conn.host) lines.push(`POSTGRES_HOST_${id} = "${conn.host}"`);
            if (conn.db) lines.push(`POSTGRES_DB_${id} = "${conn.db}"`);
            if (conn.schema)
                lines.push(`POSTGRES_SCHEMA_${id} = "${conn.schema}"`);
            if (conn.user) lines.push(`POSTGRES_USER_${id} = "${conn.user}"`);
            if (conn.password)
                lines.push(`POSTGRES_PASSWORD_${id} = "${conn.password}"`);
            if (conn.port) lines.push(`POSTGRES_PORT_${id} = ${conn.port}`);

            return lines.join("\n");
        })
        .join("\n\n");
}
