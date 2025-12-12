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

            // Limpiar el valor (quitar comillas)
            const value = rawValue.trim().replace(/^['"]|['"]$/g, "");

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
                const value = rawValue.trim().replace(/^['"]|['"]$/g, "");

                if (!baseId) {
                    baseId = connectionId;
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
            // Crear un ID único basado en el ID base + DB para diferenciar conexiones
            connection.id = connection.db
                ? `${baseId}_${connection.db}`
                : `${baseId}_${blockIndex + 1}`;
            allConnections.push(connection);
        }
    }

    return allConnections;
}
