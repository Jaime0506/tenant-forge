import { useState, useEffect } from "react";
import EnvEditor from "./EnvEditor";
import SqlEditor from "./SqlEditor";
import useStoreManagement from "@/hooks/useStoreManagement";
import EnvEditorWarningIcon from "./EnvEditorWarningIcon";
import { ProjectData } from "@/hooks/useProject";
import { useProjectConnections } from "@/hooks/useProjectConnections";
import { useProjectService } from "@/hooks/useProjectService";
import { toast } from "sonner";
import ButtonCustom from "../ui-custom/ButtonCustom";
import { Save } from "lucide-react";
import {
    DatabaseConnection,
    getUniqueConnections,
    serializeEnvConnections,
} from "./envParser";

/**
 * Asigna id válido y desambigua duplicados usando host + puerto
 * para que cada conexión sea identificable y seleccionable por separado.
 */
function normalizeConnections(
    list: DatabaseConnection[]
): DatabaseConnection[] {
    const filtered = list.filter(
        (c): c is DatabaseConnection => c != null && typeof c === "object"
    );
    const withId = filtered.map((c, i) => {
        const id =
            c.id != null && String(c.id).trim() !== ""
                ? String(c.id).trim()
                : (c.envKey ?? `connection_${i + 1}`);
        return { ...c, id };
    });

    const idCount = new Map<string, number>();
    for (const c of withId) {
        idCount.set(c.id, (idCount.get(c.id) ?? 0) + 1);
    }
    const usedIds = new Set<string>();
    return withId.map((conn) => {
        if ((idCount.get(conn.id) ?? 0) <= 1) {
            usedIds.add(conn.id);
            return conn;
        }
        let candidate = conn.id;
        if (conn.port != null) candidate = `${conn.id}_${conn.port}`;
        if (usedIds.has(candidate) && (conn.host || conn.port != null)) {
            const hostPart = String(conn.host ?? "host").replace(/\./g, "_");
            candidate = `${conn.id}_${hostPart}_${conn.port ?? ""}`;
        }
        let suffix = 0;
        while (usedIds.has(candidate)) {
            suffix++;
            candidate = `${conn.id}_${suffix}`;
        }
        usedIds.add(candidate);
        return { ...conn, id: candidate };
    });
}

interface ProjectEditorProps {
    id: number;
    project: ProjectData;
}

export default function ProjectEditor({ id, project }: ProjectEditorProps) {
    const [envContent, setEnvContent] = useState("");
    const [sqlContent, setSqlContent] = useState(project?.scripts || "");
    const [shouldAnimateWarning, setShouldAnimateWarning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { saveProject } = useProjectService();

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

    /**
     * Limpia todas las comillas de un string
     */
    const cleanQuotes = (value: string | undefined): string | undefined => {
        if (!value) return value;
        let cleaned = value.trim();
        let iterations = 0;
        const maxIterations = 10;
        while (iterations < maxIterations) {
            const before = cleaned;
            cleaned = cleaned.replace(/^['''']+/g, "").replace(/['''']+$/g, "");
            cleaned = cleaned.replace(/^[""""]+/g, "").replace(/[""""]+$/g, "");
            if (before === cleaned) break;
            iterations++;
        }
        return cleaned.trim();
    };

    const handleGlobalSave = async () => {
        if (!id) {
            toast.error("No se ha especificado el ID del proyecto");
            return;
        }

        try {
            setIsSaving(true);
            let fixedConnections: DatabaseConnection[] = [];

            if (envContent.trim()) {
                const parsedConnections = getUniqueConnections(envContent);
                const usedConnectionIds = new Set<string>();

                fixedConnections = parsedConnections.map((connection) => {
                    let match: DatabaseConnection | undefined;

                    match = connections.find(
                        (c) => !usedConnectionIds.has(c.id) && c.id === connection.id
                    );

                    if (!match && connection.envKey) {
                        match = connections.find(
                            (c) =>
                                !usedConnectionIds.has(c.id) &&
                                c.envKey === connection.envKey &&
                                c.host === connection.host &&
                                c.port === connection.port
                        );
                    }

                    if (!match && connection.envKey) {
                        match = connections.find(
                            (c) =>
                                !usedConnectionIds.has(c.id) &&
                                c.envKey === connection.envKey
                        );
                    }

                    if (match) {
                        usedConnectionIds.add(match.id);
                    }

                    return {
                        id: cleanQuotes(connection.id) || connection.id,
                        envKey: connection.envKey ?? match?.envKey,
                        displayName: match?.displayName,
                        type: cleanQuotes(connection.type),
                        host: cleanQuotes(connection.host),
                        db: cleanQuotes(connection.db),
                        schema: cleanQuotes(connection.schema),
                        user: cleanQuotes(connection.user),
                        password: cleanQuotes(connection.password),
                        port: connection.port,
                    };
                });
            }

            await saveProject(id, fixedConnections, sqlContent);
            toast.success("Proyecto guardado exitosamente");
        } catch (error) {
            console.error("Error guardando proyecto:", error);
            toast.error(`Error al guardar: ${error}`);
        } finally {
            setIsSaving(false);
        }
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
    }, [project?.id, project?.connections, handleEnvConfirm]);

    return (
        <main className="flex w-full h-full max-h-[90vh] rounded-2xl border border-cerulean-500/30 flex-col gap-6 p-6 sm:p-8 bg-ink-black-950/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Información del proyecto y Botón Guardar */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-cerulean-500 uppercase tracking-[0.2em] leading-none mb-1.5">
                        Proyecto Activo
                    </span>
                    <h1 className="text-xl font-black text-white tracking-tighter leading-none">
                        {project.name}
                    </h1>
                </div>
                
                <ButtonCustom
                    isLoading={isSaving}
                    onClick={handleGlobalSave}
                    className="gap-2.5 bg-ink-black-900/40 backdrop-blur-md border border-cerulean-800/50 text-white hover:bg-ink-black-800 rounded-xl h-auto px-6 py-3 font-black uppercase tracking-widest text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50"
                    disabled={isSaving || !id}
                >
                    <Save className="size-4" />
                    Guardar Proyecto
                </ButtonCustom>
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
