import { useEffect, useState, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { syntaxHighlighting } from "@codemirror/language";
import { Play } from "lucide-react";
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

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  connections?: DatabaseConnection[];
  onExecute: (selectedConnections: DatabaseConnection[]) => void;
  onRenameConnection?: (connectionId: string, displayName: string) => void;
  isExecutingSql: boolean;
  executionResults?: ExecutionResult[] | null;
}

export default function SqlEditor({
  value,
  onChange,
  connections = [],
  onExecute,
  onRenameConnection,
  isExecutingSql,
  executionResults = null,
}: SqlEditorProps) {
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

  const handleExecute = () => {
    if (isExecutingSql) return;
    const selected = connections.filter((conn) =>
      selectedConnections.has(conn.id)
    );
    onExecute(selected);
  };

  // Mantener referencia actualizada de handleExecute para no recrear sqlExtensions
  const handleExecuteRef = useRef(handleExecute);
  useEffect(() => {
    handleExecuteRef.current = handleExecute;
  }, [handleExecute]);

  const handleRetrySingle = (conn: DatabaseConnection) => {
    onExecute([conn]);
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
      />

      {/* Barra de herramientas compacta y profesional */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-surface-border bg-surface-2/30 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] bg-surface-base px-2 py-0.5 rounded border border-surface-border">
            PostgreSQL Dialect
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-base border border-surface-border text-[10px] font-mono">
              ⌘ / Ctrl + Enter
            </kbd>
            <span>para ejecutar</span>
          </span>
        </div>

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
              : `Ejecutar (${selectedConnections.size})`}
          </span>
        </Button>
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
        onRetryConnection={handleRetrySingle}
      />
    </div>
  );
}
