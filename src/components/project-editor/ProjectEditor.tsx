import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import EnvEditor from "./EnvEditor";
import SqlEditor from "./SqlEditor";
import useStoreManagement from "@/hooks/useStoreManagement";
import EnvEditorWarningIcon from "./EnvEditorWarningIcon";
import { ProjectData } from "@/hooks/useProject";
import { useProjectConnections } from "@/hooks/useProjectConnections";
import { DatabaseConnection, getUniqueConnections } from "./envParser";

interface ProjectEditorProps {
    id: number;
    project: ProjectData;
}

export default function ProjectEditor({ id, project }: ProjectEditorProps) {
    const navigate = useNavigate();
    const [envContent, setEnvContent] = useState("");
    const [sqlContent, setSqlContent] = useState("");
    const [shouldAnimateWarning, setShouldAnimateWarning] = useState(false);

    console.log("projectEditor", project);

    const { isEnvEditorWarningShown } = useStoreManagement();

    // Hook para manejar toda la lógica de conexiones
    const {
        connections,
        isExecutingSql,
        executionResults,
        handleEnvConfirm,
        executeSql,
    } = useProjectConnections();

    const handleExecuteSql = async (selectedConnections: DatabaseConnection[]) => {
        await executeSql(sqlContent, selectedConnections);
    };

    useEffect(() => {
        // Cuando isEnvEditorWarningShown se carga y es true, activar la animación
        if (isEnvEditorWarningShown === true) {
            setShouldAnimateWarning(true);
        }
    }, [isEnvEditorWarningShown]);

    // Cargar connections guardadas en el proyecto al montar el componente
    useEffect(() => {
        if (project.connections && project.connections.trim() !== "") {
            // Cargar el contenido de connections en el editor .env
            setEnvContent(project.connections);

            // Parsear y cargar las conexiones automáticamente
            const parsedConnections = getUniqueConnections(project.connections);
            if (parsedConnections.length > 0) {
                handleEnvConfirm(parsedConnections);
            }
        }
    }, [project.connections, handleEnvConfirm]);

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
                    {project.name}
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
                            projectId={id}
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
