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

function normalizeConnections(
    list: DatabaseConnection[]
): DatabaseConnection[] {
    return list
        .filter((c): c is DatabaseConnection => c != null && typeof c === "object")
        .map((c, i) => {
            const id =
                c.id != null && String(c.id).trim() !== ""
                    ? String(c.id).trim()
                    : (c.envKey ?? `connection_${i + 1}`);
            return { ...c, id };
        });
}

interface ProjectEditorProps {
    id: number;
    project: ProjectData;
}

export default function ProjectEditor({ id, project }: ProjectEditorProps) {
    const [envContent, setEnvContent] = useState("");
    const [sqlContent, setSqlContent] = useState("");
    const [shouldAnimateWarning, setShouldAnimateWarning] = useState(false);

    const { isEnvEditorWarningShown } = useStoreManagement();

    const {
        connections,
        isExecutingSql,
        executionResults,
        handleEnvConfirm,
        updateConnectionDisplayName,
        executeSql,
    } = useProjectConnections();

    if (!project) {
        return (
            <main className="flex w-full h-full items-center justify-center rounded-2xl border border-cerulean-500/30 p-6 bg-ink-black-950/90">
                <p className="text-sm text-ink-black-400">Proyecto no disponible</p>
            </main>
        );
    }

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
        const raw = project?.connections;
        if (raw == null || typeof raw !== "string" || raw.trim() === "") {
            return;
        }
        let connectionsToLoad: DatabaseConnection[] = [];
        let displayContent = raw;
        try {
            if (raw.trim().startsWith("[")) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    connectionsToLoad = normalizeConnections(parsed);
                    displayContent = serializeEnvConnections(connectionsToLoad);
                }
            }
            if (connectionsToLoad.length === 0) {
                connectionsToLoad = getUniqueConnections(raw);
                connectionsToLoad = normalizeConnections(connectionsToLoad);
            }
            setEnvContent(displayContent);
            if (connectionsToLoad.length > 0) {
                handleEnvConfirm(connectionsToLoad);
            }
        } catch (e) {
            console.error("Error cargando conexiones del proyecto:", e);
            setEnvContent(raw);
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
                            currentConnections={connections}
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
                            onRenameConnection={updateConnectionDisplayName}
                            isExecutingSql={isExecutingSql}
                            executionResults={executionResults}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
