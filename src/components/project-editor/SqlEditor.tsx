import { useEffect, useState, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { syntaxHighlighting } from "@codemirror/language";
import { Play, Square, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatabaseConnection } from "./envParser";
import { getSqlHighlightStyle, getSqlTheme } from "./sqlEditorTheme";
import ConnectionsPanel from "./ConnectionsPanel";
import SqlExecutionResults from "./SqlExecutionResults";
import { useThemeDetector } from "@/hooks/useThemeDetector";
import SearchPanel from "./SearchPanel";
import { keymap } from "@codemirror/view";
import { cinematicSearchField, cinematicSearchTheme } from "./cinematicSearchExtension";
import { ExecutionResult } from "./SqlExecutionInspector";
import { analyzeSql } from "./sqlUtils";
import ConfirmExecutionDialog, { ExecutionReview, needsConfirmation } from "./ConfirmExecutionDialog";
import {
  ExecutionMode,
  ExecutionPhase,
  getMigrationStatusService,
  MigrationStatus,
  MODE_LABELS,
} from "@/services/execution.service";
import { sanitizeConnection } from "./envParser";

export interface RunRequest {
  connections: DatabaseConnection[];
  mode: ExecutionMode;
  trackMigration: boolean;
  force: boolean;
  /** Reintento: conservar en la consola los resultados de los demás tenants */
  merge?: boolean;
}

/** A partir de cuántos tenants el modo todo o nada pide confirmación por conexiones abiertas */
const MANY_CONNECTIONS = 100;

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  connections?: DatabaseConnection[];
  onExecute: (request: RunRequest) => void;
  onCancel?: () => void;
  onRenameConnection?: (connectionId: string, displayName: string) => void;
  isExecutingSql: boolean;
  executionPhase?: ExecutionPhase | null;
  executionResults?: ExecutionResult[] | null;
  onClearResults?: () => void;
  defaultMode: ExecutionMode;
  projectName: string;
}

export default function SqlEditor({
  value,
  onChange,
  connections = [],
  onExecute,
  onCancel,
  onRenameConnection,
  isExecutingSql,
  executionPhase = null,
  executionResults = null,
  onClearResults,
  defaultMode,
  projectName,
}: SqlEditorProps) {
  const [mode, setMode] = useState<ExecutionMode>(defaultMode);
  const [trackMigration, setTrackMigration] = useState(true);
  const [force, setForce] = useState(false);
  const [pendingReview, setPendingReview] = useState<{ review: ExecutionReview; request: RunRequest } | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<Map<string, MigrationStatus> | undefined>();
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => setMode(defaultMode), [defaultMode]);
  // El estado de migración corresponde a un script concreto: invalidarlo al editar
  useEffect(() => setMigrationStatus(undefined), [value]);

  const analysis = useMemo(() => analyzeSql(value), [value]);
  const isDark = useThemeDetector();
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(
    new Set()
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  // Auto-select all connections when new ones arrive
  useEffect(() => {
    if (connections.length > 0) {
      setSelectedConnections(new Set(connections.map((c) => c.id)));
    }
  }, [connections]);

  const toggleConnection = (connectionId: string) => {
    setSelectedConnections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedConnections(new Set(connections.map((c) => c.id)));
  };

  const selectNone = () => {
    setSelectedConnections(new Set());
  };

  const selectGroup = (group: string) => {
    setSelectedConnections(new Set(connections.filter((c) => c.group === group).map((c) => c.id)));
  };

  /** Revisa el script y pide confirmación si hace falta antes de ejecutar. */
  const requestRun = (request: RunRequest) => {
    if (isExecutingSql || request.connections.length === 0) return;
    if (!value.trim()) {
      toast.error("El editor SQL está vacío");
      return;
    }
    const review: ExecutionReview = {
      destructive: request.mode === "dry_run" ? [] : analysis.destructive,
      tenantCount: request.connections.length,
      prodTenants: request.connections
        .filter((c) => c.group?.toLowerCase() === "prod")
        .map((c) => c.displayName || c.db || c.id),
      mode: request.mode,
      manyOpenConnections: request.mode === "all_or_nothing" && request.connections.length > MANY_CONNECTIONS,
    };
    if (needsConfirmation(review)) {
      setPendingReview({ review, request });
    } else {
      onExecute(request);
    }
  };

  const handleExecute = () => {
    requestRun({
      connections: connections.filter((conn) => selectedConnections.has(conn.id)),
      mode,
      trackMigration,
      force,
    });
  };

  const handleCheckStatus = async () => {
    const selected = connections.filter((c) => selectedConnections.has(c.id));
    if (selected.length === 0 || !value.trim()) return;
    setCheckingStatus(true);
    try {
      const statuses = await getMigrationStatusService(value, selected.map(sanitizeConnection));
      setMigrationStatus(new Map(statuses.map((st) => [st.connectionId, st])));
      const applied = statuses.filter((st) => st.state === "applied").length;
      const pending = statuses.filter((st) => st.state === "pending").length;
      const errors = statuses.length - applied - pending;
      toast.info(`Script aplicado en ${applied}, pendiente en ${pending}${errors ? `, ${errors} sin acceso` : ""}`);
    } catch (e) {
      toast.error(`No se pudo consultar el estado: ${e}`);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Mantener referencia actualizada de handleExecute para no recrear sqlExtensions
  const handleExecuteRef = useRef(handleExecute);
  useEffect(() => {
    handleExecuteRef.current = handleExecute;
  }, [handleExecute]);

  const handleRetry = (conns: DatabaseConnection[]) => {
    requestRun({ connections: conns, mode, trackMigration, force, merge: true });
  };

  // Extensiones estables que solo cambian si cambia el tema claro/oscuro
  const sqlExtensions: Extension[] = useMemo(() => [
    sql({
      dialect: PostgreSQL,
      upperCaseKeywords: true,
    }),
    syntaxHighlighting(getSqlHighlightStyle(isDark)),
    getSqlTheme(isDark),
    EditorView.lineWrapping,
    cinematicSearchField,
    cinematicSearchTheme,
    keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          handleExecuteRef.current();
          return true;
        },
      },
      {
        key: "Mod-f",
        run: () => {
          setIsSearchVisible(true);
          return true;
        },
      },
    ]),
  ], [isDark]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface-1">
      {/* Panel de conexiones / tenants */}
      <ConnectionsPanel
        connections={connections}
        selectedConnections={selectedConnections}
        onToggleConnection={toggleConnection}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        onRename={onRenameConnection}
        onSelectGroup={selectGroup}
        migrationStatus={migrationStatus}
      />

      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-surface-border bg-surface-2/30 backdrop-blur-md shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ExecutionMode)}
            disabled={isExecutingSql}
            title={MODE_LABELS[mode].hint}
            className="text-[11px] font-medium bg-surface-base px-2 py-0.5 rounded border border-surface-border text-foreground focus:outline-none focus:border-cerulean-500/50 cursor-pointer"
          >
            {(Object.keys(MODE_LABELS) as ExecutionMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m].label}
              </option>
            ))}
          </select>

          <label
            className={`inline-flex items-center gap-1 text-[11px] select-none ${
              analysis.readOnly ? "opacity-50" : "cursor-pointer"
            }`}
            title={
              analysis.readOnly
                ? "Las consultas de solo lectura no se registran"
                : "Registra el script en _tenant_forge_migrations de cada tenant y omite los tenants donde ya se aplicó"
            }
          >
            <input
              type="checkbox"
              checked={trackMigration && !analysis.readOnly}
              disabled={analysis.readOnly || isExecutingSql}
              onChange={(e) => setTrackMigration(e.target.checked)}
              className="accent-cerulean-500"
            />
            Registrar como migración
          </label>

          {trackMigration && !analysis.readOnly && (
            <label
              className="inline-flex items-center gap-1 text-[11px] cursor-pointer select-none"
              title="Ejecuta incluso en los tenants donde el script ya consta como aplicado"
            >
              <input
                type="checkbox"
                checked={force}
                disabled={isExecutingSql}
                onChange={(e) => setForce(e.target.checked)}
                className="accent-error"
              />
              Forzar
            </label>
          )}

          {!analysis.readOnly && (
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingStatus || isExecutingSql || selectedConnections.size === 0 || !value.trim()}
              className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded hover:bg-surface-2 hover:text-foreground disabled:opacity-50 cursor-pointer"
              title="Consultar en qué tenants seleccionados ya está aplicado este script"
            >
              <ListChecks className="size-3" />
              {checkingStatus ? "Consultando..." : "Ver estado"}
            </button>
          )}

          <span className="hidden lg:inline-flex items-center gap-1 text-[11px]">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-base border border-surface-border text-[10px] font-mono">
              ⌘ / Ctrl + Enter
            </kbd>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isExecutingSql && onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="surface"
              size="auto"
              className="px-3 py-1.5 text-xs"
              title="Cancelar las consultas en curso (en Todo o nada revierte en todos)"
            >
              <Square className="size-3 fill-current text-error" />
              <span>Cancelar</span>
            </Button>
          )}
          <Button
            type="button"
            onClick={handleExecute}
            disabled={isExecutingSql || selectedConnections.size === 0}
            variant="cta"
            size="auto"
            className="px-3.5 py-1.5 text-xs"
          >
            {isExecutingSql ? (
              <div className="size-3.5 rounded-full border-2 border-surface-base border-t-transparent animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            <span>
              {isExecutingSql
                ? "Ejecutando..."
                : `${mode === "dry_run" ? "Probar" : "Ejecutar"} (${selectedConnections.size})`}
            </span>
          </Button>
        </div>
      </div>

      {/* Editor CodeMirror */}
      <div className="relative flex-1 min-h-0 bg-surface-base">
        <div className="absolute inset-0">
          <CodeMirror
            value={value}
            onChange={onChange}
            height="100%"
            style={{ height: "100%" }}
            onCreateEditor={(view) => setEditorView(view)}
            extensions={sqlExtensions}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightSelectionMatches: false,
              searchKeymap: false,
            }}
            placeholder="-- Escribe tus consultas o migraciones SQL aquí...&#10;SELECT * FROM users WHERE active = true;"
          />

          {editorView && (
            <SearchPanel
              view={editorView}
              isVisible={isSearchVisible}
              onClose={() => setIsSearchVisible(false)}
            />
          )}

          <style>{`
            .cm-editor {
              height: 100% !important;
              background-color: transparent !important;
            }
            .cm-scroller {
              font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
              font-size: 13px !important;
              line-height: 1.6 !important;
            }
            .cm-gutters {
              background-color: var(--color-surface-base) !important;
              border-right: 1px solid rgba(var(--brand-rgb), 0.08) !important;
              color: var(--muted-foreground) !important;
              padding-right: 8px !important;
            }
            .cm-activeLineGutter {
              color: var(--color-cerulean-400) !important;
              background-color: rgba(var(--brand-rgb), 0.06) !important;
            }
            .cm-activeLine {
              background-color: rgba(var(--brand-rgb), 0.04) !important;
            }
          `}</style>
        </div>
      </div>

      {/* Consola de Resultados e Inspector de Errores */}
      <SqlExecutionResults
        results={executionResults}
        connections={connections}
        isExecuting={isExecutingSql}
        phase={executionPhase}
        onRetryConnection={(conn) => handleRetry([conn])}
        onRetryFailed={handleRetry}
        onClear={onClearResults}
      />

      <ConfirmExecutionDialog
        review={pendingReview?.review ?? null}
        projectName={projectName}
        onCancel={() => setPendingReview(null)}
        onConfirm={() => {
          const request = pendingReview?.request;
          setPendingReview(null);
          if (request) onExecute(request);
        }}
      />
    </div>
  );
}
