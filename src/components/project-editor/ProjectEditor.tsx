import { useState, useEffect, useCallback } from "react";
import EnvEditor from "./EnvEditor";
import SqlEditor, { RunRequest } from "./SqlEditor";
import useStoreManagement from "@/hooks/useStoreManagement";
import EnvEditorWarningIcon from "./EnvEditorWarningIcon";
import { ProjectData } from "@/hooks/useProject";
import { useProjectConnections } from "@/hooks/useProjectConnections";
import { useProjectService } from "@/hooks/useProjectService";
import { toast } from "sonner";
import { Save, Database, FileCode2, History, Settings2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DatabaseConnection,
  getUniqueConnections,
  sanitizeConnection,
  serializeEnvConnections,
} from "./envParser";
import ProjectSettingsDialog from "./ProjectSettingsDialog";
import ExecutionHistoryDialog from "./ExecutionHistoryDialog";
import {
  parseSettings,
  ProjectSettings,
  saveProjectSettingsService,
} from "@/services/execution.service";
import { getProjectByIdService } from "@/services/project.service";

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
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const { saveProject } = useProjectService();
  const [settings, setSettings] = useState<ProjectSettings>(() => parseSettings(project?.settings));
  const [insecureStorage, setInsecureStorage] = useState(!!project?.insecure_storage);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // La lista de proyectos puede estar desactualizada: refrescar settings y estado del keychain
  useEffect(() => {
    if (!id) return;
    getProjectByIdService(id)
      .then((fresh) => {
        const p = fresh as ProjectData | null;
        if (!p) return;
        setSettings(parseSettings(p.settings));
        setInsecureStorage(!!p.insecure_storage);
      })
      .catch((e) => console.error("No se pudo refrescar el proyecto:", e));
  }, [id]);

  const { isEnvEditorWarningShown } = useStoreManagement();

  const {
    connections,
    isExecutingSql,
    executionResults,
    executionPhase,
    handleEnvConfirm,
    updateConnectionDisplayName,
    executeSql,
    cancelExecution,
    clearResults,
  } = useProjectConnections();

  const handleExecuteSql = async (request: RunRequest) => {
    await executeSql(
      sqlContent,
      request.connections,
      {
        projectId: id,
        mode: request.mode,
        trackMigration: request.trackMigration,
        force: request.force,
        concurrency: settings.concurrency,
        statementTimeoutMs: settings.statementTimeoutMs || undefined,
        lockTimeoutMs: settings.lockTimeoutMs || undefined,
        maxRows: settings.maxRows,
      },
      request.merge
    );
  };

  const handleCancel = async () => {
    const ok = await cancelExecution();
    if (ok) toast.info("Cancelando ejecución...");
  };

  const handleSaveSettings = async (next: ProjectSettings) => {
    try {
      await saveProjectSettingsService(id, next);
      setSettings(next);
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error(`No se pudo guardar la configuración: ${e}`);
      throw e;
    }
  };

  const handleGlobalSave = useCallback(async () => {
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
            ...sanitizeConnection(connection),
            envKey: connection.envKey ?? match?.envKey,
            displayName: match?.displayName,
          };
        });
      }

      const result = (await saveProject(id, fixedConnections, sqlContent)) as
        | { success: boolean; message: string }
        | undefined;
      const insecure = !!result?.message?.includes("keychain");
      setInsecureStorage(insecure);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      if (insecure) {
        toast.warning(result!.message);
      } else {
        toast.success("Proyecto guardado correctamente");
      }
    } catch (error) {
      console.error("Error guardando proyecto:", error);
      toast.error(`Error al guardar: ${error}`);
    } finally {
      setIsSaving(false);
    }
  }, [id, envContent, connections, sqlContent, saveProject]);

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleGlobalSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGlobalSave]);

  useEffect(() => {
    if (isEnvEditorWarningShown === true) {
      setShouldAnimateWarning(true);
    }
  }, [isEnvEditorWarningShown]);

  // Cargar connections guardadas en el proyecto
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

  if (!project) {
    return (
      <div className="flex w-full h-full items-center justify-center rounded-xl border border-surface-border p-6 bg-surface-1">
        <p className="text-sm text-muted-foreground">Proyecto no disponible</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full flex-col gap-3 p-4 sm:p-5 bg-surface-1/90 backdrop-blur-xl border border-surface-border rounded-xl overflow-hidden shadow-2xl">
      {/* Header del Espacio de Trabajo */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-cerulean-500/10 border border-cerulean-500/20 flex items-center justify-center text-cerulean-400 shrink-0">
            <Database className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground truncate tracking-tight">
                {project.name}
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-surface-2 text-muted-foreground border border-surface-border shrink-0">
                {connections.length} {connections.length === 1 ? "tenant" : "tenants"}
              </span>
            </div>

            <p className="text-xs text-muted-foreground truncate">
              {project.description || "Workspace multi-tenant configurado"}
              {lastSavedTime && (
                <span className="ml-2 text-[10px] text-cerulean-400 font-mono">
                  · Guardado {lastSavedTime}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          {insecureStorage && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-warning/10 text-warning border border-warning/30"
              title="El keychain del sistema no está disponible: las contraseñas se guardan en texto plano en la base local"
            >
              <ShieldAlert className="size-3.5" />
              Contraseñas sin cifrar
            </span>
          )}
          <Button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            disabled={!id}
            variant="surface"
            size="auto"
            className="px-2.5 py-1.5 text-xs"
            title="Historial de ejecuciones"
          >
            <History className="size-3.5 text-cerulean-400" />
            <span className="hidden md:inline">Historial</span>
          </Button>
          <Button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            disabled={!id}
            variant="surface"
            size="auto"
            className="px-2.5 py-1.5 text-xs"
            title="Configuración de ejecución"
          >
            <Settings2 className="size-3.5 text-cerulean-400" />
          </Button>
          <Button
            type="button"
            onClick={handleGlobalSave}
            disabled={isSaving || !id}
            variant="surface"
            size="auto"
            className="px-3.5 py-1.5 text-xs"
          >
            {isSaving ? (
              <div className="size-3.5 rounded-full border-2 border-cerulean-400 border-t-transparent animate-spin" />
            ) : (
              <Save className="size-3.5 text-cerulean-400" />
            )}
            <span>{isSaving ? "Guardando..." : "Guardar Proyecto"}</span>
            <kbd className="hidden md:inline text-[10px] font-mono text-muted-foreground bg-surface-base px-1.5 py-0.5 rounded border border-surface-border">
              ⌘S
            </kbd>
          </Button>
        </div>
      </div>

      {/* Contenedor principal de dos columnas */}
      <div className="flex flex-1 min-h-0 gap-3.5">
        {/* Columna Izquierda: Editor de Variables de Entorno */}
        <div className="flex flex-col w-5/12 border border-surface-border rounded-lg overflow-hidden bg-surface-base/80">
          <div className="px-3.5 py-2 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface-2/40">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-3.5 text-cerulean-400" />
              <span className="text-xs font-semibold text-foreground tracking-tight">
                Variables de Entorno (.env)
              </span>
            </div>
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

        {/* Columna Derecha: Editor SQL PostgreSQL & Consola de Errores */}
        <div className="flex flex-col w-7/12 border border-surface-border rounded-lg overflow-hidden bg-surface-base/80">
          <div className="px-3.5 py-2 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface-2/40">
            <div className="flex items-center gap-2">
              <Database className="size-3.5 text-cerulean-400" />
              <span className="text-xs font-semibold text-foreground tracking-tight">
                Editor SQL & Migraciones Multi-tenant
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <SqlEditor
              value={sqlContent}
              onChange={setSqlContent}
              connections={connections}
              onExecute={handleExecuteSql}
              onCancel={handleCancel}
              onRenameConnection={updateConnectionDisplayName}
              isExecutingSql={isExecutingSql}
              executionPhase={executionPhase}
              executionResults={executionResults}
              onClearResults={clearResults}
              defaultMode={settings.defaultMode}
              projectName={project.name}
            />
          </div>
        </div>
      </div>

      <ProjectSettingsDialog
        open={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
      <ExecutionHistoryDialog
        open={isHistoryOpen}
        projectId={id}
        onClose={() => setIsHistoryOpen(false)}
        onLoadSql={setSqlContent}
      />
    </div>
  );
}
