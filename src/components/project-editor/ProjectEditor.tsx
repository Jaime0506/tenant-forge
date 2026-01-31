import { useState, useEffect } from "react";
import EnvEditor from "./EnvEditor";
import SqlEditor from "./SqlEditor";
import useStoreManagement from "@/hooks/useStoreManagement";
import EnvEditorWarningIcon from "./EnvEditorWarningIcon";
import { ProjectData } from "@/hooks/useProject";
import { useProjectConnections } from "@/hooks/useProjectConnections";
import {
    DatabaseConnection,
    getUniqueConnections,
    serializeEnvConnections,
} from "./envParser";

interface ProjectEditorProps {
    id: number;
    project: ProjectData;
}

export default function ProjectEditor({ id, project }: ProjectEditorProps) {
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
            let connectionsToLoad: DatabaseConnection[] = [];
            let displayContent = project.connections;

            // Intentar parsear como JSON si parece una lista
            if (project.connections.trim().startsWith("[")) {
                try {
                    const parsed = JSON.parse(project.connections);
                    if (Array.isArray(parsed)) {
                        connectionsToLoad = parsed;
                        displayContent = serializeEnvConnections(parsed);
                    }
                } catch (e) {
                    // Si falla el parseo JSON, lo dejamos como está para intentar parsearlo como .env
                    console.error(
                        "Error parseando conexiones JSON, intentando como .env:",
                        e
                    );
                }
            }

            // Si no se han cargado conexiones (porque no era JSON o falló), intentar parsear como .env
            if (connectionsToLoad.length === 0) {
                connectionsToLoad = getUniqueConnections(project.connections);
            }

            // Cargar el contenido (serializado si era JSON) en el editor .env
            setEnvContent(displayContent);

            // Cargar las conexiones automáticamente en el panel
            if (connectionsToLoad.length > 0) {
                handleEnvConfirm(connectionsToLoad);
            }
        }
    }, [project.connections, handleEnvConfirm]);

    return (
        <main className="flex w-full h-full max-h-[90vh] rounded-2xl border border-cerulean-500/30 flex-col gap-6 p-6 sm:p-8 bg-ink-black-950/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Información del proyecto (Opcional, ya que el nombre está en el Tab) */}
            <div className="flex items-center gap-3 mb-2">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-cerulean-500 uppercase tracking-[0.2em] leading-none mb-1.5">
                        Proyecto Activo
                    </span>
                    <h1 className="text-xl font-black text-white tracking-tighter leading-none">
                        {project.name}
                    </h1>
                </div>
            </div>

            {/* Contenedor principal con dos columnas */}
            <div className="flex flex-1 min-h-0 gap-6">
                {/* Columna izquierda - Editor .env */}
                <div className="flex flex-col w-1/2 border border-cerulean-500/10 rounded-xl overflow-hidden bg-ink-black-950/40 backdrop-blur-sm">
                    <div className="p-4 border-b border-cerulean-500/10 flex flex-row space-between items-center gap-2 shrink-0 bg-ink-black-900/40">
                        <h2 className="text-xs font-black text-cerulean-500 uppercase tracking-[0.2em] flex-1">
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
                <div className="flex flex-col w-1/2 border border-cerulean-500/10 rounded-xl overflow-hidden bg-ink-black-950/40 backdrop-blur-sm">
                    <div className="p-4 border-b border-cerulean-500/10 shrink-0 bg-ink-black-900/40">
                        <h2 className="text-xs font-black text-cerulean-500 uppercase tracking-[0.2em]">
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
