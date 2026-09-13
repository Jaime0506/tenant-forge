import { useState, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { Database, RefreshCw } from "lucide-react";
import { getUniqueConnections, DatabaseConnection } from "./envParser";
import { envParser, getEnvHighlightStyle, getEnvTheme } from "./envEditorTheme";
import { useThemeDetector } from "@/hooks/useThemeDetector";
import SearchPanel from "./SearchPanel";
import { keymap } from "@codemirror/view";
import { cinematicSearchField, cinematicSearchTheme } from "./cinematicSearchExtension";

interface EnvEditorProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm?: (connections: DatabaseConnection[]) => void;
  currentConnections?: DatabaseConnection[];
}

export default function EnvEditor({
  value,
  onChange,
  onConfirm,
  currentConnections = [],
}: EnvEditorProps) {
  const isDark = useThemeDetector();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  // Auto-detect connections count
  const detected = useMemo(() => {
    if (!value.trim()) return [];
    try {
      return getUniqueConnections(value);
    } catch {
      return [];
    }
  }, [value]);

  const envExtensions: Extension[] = [
    envParser,
    syntaxHighlighting(getEnvHighlightStyle(isDark)),
    getEnvTheme(isDark),
    EditorView.lineWrapping,
    cinematicSearchField,
    cinematicSearchTheme,
    keymap.of([
      {
        key: "Mod-f",
        run: () => {
          setIsSearchVisible(true);
          return true;
        },
      },
    ]),
  ];

  const handleConfirm = () => {
    const connections = getUniqueConnections(value);
    onConfirm?.(connections);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-surface-1">
      {/* Editor CodeMirror */}
      <div className="flex-1 min-h-0 relative bg-surface-base">
        <div className="absolute inset-0">
          <CodeMirror
            value={value}
            onChange={onChange}
            height="100%"
            style={{ height: "100%" }}
            onCreateEditor={(view) => setEditorView(view)}
            extensions={envExtensions}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: false,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              highlightSelectionMatches: false,
              searchKeymap: false,
            }}
            placeholder="# Pega aquí las variables de entorno con formato de conexión:&#10;POSTGRES_TYPE_TENANT1 = 'postgres'&#10;POSTGRES_HOST_TENANT1 = 'localhost'&#10;POSTGRES_DB_TENANT1 = 'tenant1_db'&#10;POSTGRES_USER_TENANT1 = 'admin'&#10;POSTGRES_PASSWORD_TENANT1 = 'secret'&#10;POSTGRES_PORT_TENANT1 = 5432"
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
              font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace !important;
              font-size: 13px !important;
              line-height: 1.6 !important;
            }
            .cm-gutters {
              background-color: var(--color-surface-base) !important;
              border-right: 1px solid rgba(var(--brand-rgb), 0.08) !important;
              color: var(--muted-foreground) !important;
              padding-right: 8px !important;
            }
          `}</style>
        </div>
      </div>

      {/* Barra de acción inferior con resumen de tenants */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-surface-border bg-surface-2/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="size-3.5 text-cerulean-400" />
          <span>
            {detected.length > 0 ? (
              <span className="text-foreground font-medium">
                {detected.length} {detected.length === 1 ? "tenant detectado" : "tenants detectados"}
              </span>
            ) : (
              <span>Sin tenants detectados</span>
            )}
          </span>
          {currentConnections.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              ({currentConnections.length} activos)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!value.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-3 hover:bg-cerulean-500 hover:text-surface-base text-foreground border border-surface-border transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw className="size-3" />
          <span>Sincronizar Tenants</span>
        </button>
      </div>
    </div>
  );
}
