import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DatabaseConnection } from "@/components/project-editor/envParser";

interface ExecutionResult {
    connection_id: string;
    success: boolean;
    message: string;
}

/**
 * Limpia todas las comillas (simples y dobles, normales y Unicode) de un string
 * Maneja casos con comillas anidadas o múltiples capas
 */
const cleanQuotes = (value: string | undefined): string | undefined => {
    if (!value) return value;

    let cleaned = value.trim();
    let iterations = 0;
    const maxIterations = 10; // Límite de seguridad

    // Iterar hasta que no haya más cambios (elimina comillas anidadas)
    while (iterations < maxIterations) {
        const before = cleaned;

        // Eliminar todas las variantes de comillas simples del inicio y final
        // Incluye: ' (normal), ' (left single), ' (right single)
        cleaned = cleaned.replace(/^['''']+/g, "").replace(/['''']+$/g, "");

        // Eliminar todas las variantes de comillas dobles del inicio y final
        // Incluye: " (normal), " (left double), " (right double)
        cleaned = cleaned.replace(/^[""""]+/g, "").replace(/[""""]+$/g, "");

        // Si no hubo cambios, salir
        if (before === cleaned) {
            break;
        }

        iterations++;
    }

    return cleaned.trim();
};

export const useProjectConnections = () => {
    const [connections, setConnections] = useState<DatabaseConnection[]>([]);
    const [isExecutingSql, setIsExecutingSql] = useState(false);
    const [executionResults, setExecutionResults] = useState<
        ExecutionResult[] | null
    >(null);

    /**
     * Maneja la confirmación de conexiones detectadas desde el editor .env
     */
    const handleEnvConfirm = useCallback(
        (detectedConnections: DatabaseConnection[]) => {
            setConnections(detectedConnections);
        },
        []
    );

    /**
     * Limpia las comillas de las conexiones antes de ejecutar SQL
     */
    const cleanConnections = (
        connectionsToClean: DatabaseConnection[]
    ): DatabaseConnection[] => {
        return connectionsToClean.map((connection) => {
            const fixedConnection: DatabaseConnection = {
                id: cleanQuotes(connection.id) || connection.id,
                type: cleanQuotes(connection.type),
                host: cleanQuotes(connection.host),
                db: cleanQuotes(connection.db),
                schema: cleanQuotes(connection.schema),
                user: cleanQuotes(connection.user),
                password: cleanQuotes(connection.password),
                port: connection.port,
            };

            return fixedConnection;
        });
    };

    /**
     * Ejecuta SQL en las conexiones seleccionadas
     */
    const executeSql = async (
        sql: string,
        selectedConnections: DatabaseConnection[]
    ) => {
        if (selectedConnections.length === 0) {
            console.warn("No hay conexiones seleccionadas");
            return;
        }

        const fixedConnections = cleanConnections(selectedConnections);

        try {
            setIsExecutingSql(true);
            setExecutionResults(null); // Limpiar resultados anteriores

            const results = await invoke<ExecutionResult[]>("execute_sql", {
                sql,
                connections: fixedConnections,
            });

            // Guardar resultados para mostrar en el componente
            setExecutionResults(results);

            results.forEach((result) => {
                const status = result.success ? "✅" : "❌";
                console.log(
                    `${status} [${result.connection_id}]: ${result.message}`
                );
            });

            const successful = results.filter((r) => r.success).length;
            const failed = results.length - successful;
            console.log(
                `\nResumen: ${successful} exitosas, ${failed} fallidas de ${results.length} totales`
            );
        } catch (error) {
            console.error("Error ejecutando SQL:", error);
            setExecutionResults([
                {
                    connection_id: "Error",
                    success: false,
                    message: `Error al ejecutar: ${error}`,
                },
            ]);
        } finally {
            setIsExecutingSql(false);
        }
    };

    return {
        connections,
        isExecutingSql,
        executionResults,
        handleEnvConfirm,
        executeSql,
    };
};
