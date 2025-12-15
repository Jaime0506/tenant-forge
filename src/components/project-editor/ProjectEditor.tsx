import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import EnvEditor from "./EnvEditor";
import SqlEditor from "./SqlEditor";
import useStoreManagement from "@/hooks/useStoreManagement";
import EnvEditorWarningIcon from "./EnvEditorWarningIcon";
import { DatabaseConnection } from "./envParser";
import { invoke } from "@tauri-apps/api/core";

interface ProjectEditorProps {
    id: number;
}

export default function ProjectEditor({ id }: ProjectEditorProps) {
    const navigate = useNavigate();
    const [envContent, setEnvContent] = useState("");
    const [sqlContent, setSqlContent] = useState("");
    const [shouldAnimateWarning, setShouldAnimateWarning] = useState(false);
    const [connections, setConnections] = useState<DatabaseConnection[]>([]);
    const [isExecutingSql, setIsExecutingSql] = useState(false);
    const [executionResults, setExecutionResults] = useState<
        Array<{
            connection_id: string;
            success: boolean;
            message: string;
        }> | null
    >(null);

    const { isEnvEditorWarningShown } = useStoreManagement();

    const handleEnvConfirm = (detectedConnections: DatabaseConnection[]) => {
        setConnections(detectedConnections);
        console.log("Conexiones detectadas:", detectedConnections);
    };

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

    const handleExecuteSql = async (selectedConnections: DatabaseConnection[]) => {
        if (selectedConnections.length === 0) {
            console.warn("No hay conexiones seleccionadas");
            return;
        }

        const fixedConnections = selectedConnections.map((connection) => {
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

        try {
            setIsExecutingSql(true);
            setExecutionResults(null); // Limpiar resultados anteriores

            const results = await invoke<Array<{
                connection_id: string;
                success: boolean;
                message: string;
            }>>("execute_sql", { sql: sqlContent, connections: fixedConnections });

            // Guardar resultados para mostrar en el componente
            setExecutionResults(results);

            results.forEach((result) => {
                const status = result.success ? "✅" : "❌";
                console.log(`${status} [${result.connection_id}]: ${result.message}`);
            });

            const successful = results.filter((r) => r.success).length;
            const failed = results.length - successful;
            console.log(`\nResumen: ${successful} exitosas, ${failed} fallidas de ${results.length} totales`);
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

    useEffect(() => {
        // Cuando isEnvEditorWarningShown se carga y es true, activar la animación
        if (isEnvEditorWarningShown === true) {
            setShouldAnimateWarning(true);
        }
    }, [isEnvEditorWarningShown]);

    return (
        <main className="flex w-full h-full rounded-lg border border-gray-200 dark:border-gray-800 flex-col gap-6 p-6 bg-card">
            {/* Mini menú de navegación */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="size-4" />
                    Volver
                </Button>
                <h1 className="text-lg font-semibold text-foreground">
                    Proyecto #{id}
                </h1>
            </div>

            {/* Contenedor principal con dos columnas */}
            <div className="flex flex-1 min-h-0 gap-6">
                {/* Columna izquierda - Editor .env */}
                <div className="flex flex-col w-1/2 border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border flex flex-row space-between items-center gap-2 shrink-0">
                        <h2 className="text-sm font-medium text-foreground flex-1">
                            Variables de Entorno (.env)
                        </h2>
                        {isEnvEditorWarningShown && (
                            <EnvEditorWarningIcon shouldAnimate={shouldAnimateWarning} />
                        )}
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <EnvEditor
                            value={envContent}
                            onChange={setEnvContent}
                            onConfirm={handleEnvConfirm}
                        />
                    </div>
                </div>

                {/* Columna derecha - Editor SQL */}
                <div className="flex flex-col w-1/2 border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border shrink-0">
                        <h2 className="text-sm font-medium text-foreground">
                            Editor SQL (PostgreSQL)
                        </h2>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <SqlEditor
                            value={sqlContent}
                            onChange={setSqlContent}
                            connections={connections}
                            onExecute={handleExecuteSql}
                            isExecutingSql={isExecutingSql}
                            executionResults={executionResults}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
