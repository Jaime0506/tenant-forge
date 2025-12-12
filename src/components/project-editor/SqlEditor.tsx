import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { syntaxHighlighting } from "@codemirror/language";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { DatabaseConnection } from "./envParser";
import { getSqlHighlightStyle, getSqlTheme } from "./sqlEditorTheme";
import { formatSql } from "./sqlUtils";
import ConnectionsPanel from "./ConnectionsPanel";
import { useThemeDetector } from "@/hooks/useThemeDetector";

interface SqlEditorProps {
    value: string;
    onChange: (value: string) => void;
    connections?: DatabaseConnection[];
}

export default function SqlEditor({
    value,
    onChange,
    connections = [],
}: SqlEditorProps) {
    const isDark = useThemeDetector();
    const [selectedConnections, setSelectedConnections] = useState<Set<string>>(
        new Set()
    );

    // Seleccionar todas las conexiones cuando se reciben nuevas
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

    // Crear extensiones dinámicamente según el tema
    const sqlExtensions: Extension[] = [
        sql({
            dialect: PostgreSQL,
            upperCaseKeywords: true,
        }),
        syntaxHighlighting(getSqlHighlightStyle(isDark)),
        getSqlTheme(isDark),
        EditorView.lineWrapping,
    ];

    const handleFormatSql = () => {
        const formatted = formatSql(value);
        onChange(formatted);
    };

    const handleExecute = () => {
        console.log("Ejecutando SQL:", value);
        console.log(
            "Conexiones seleccionadas:",
            Array.from(selectedConnections)
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Panel de conexiones */}
            <ConnectionsPanel
                connections={connections}
                selectedConnections={selectedConnections}
                onToggleConnection={toggleConnection}
                onSelectAll={selectAll}
                onSelectNone={selectNone}
            />

            {/* Barra de herramientas */}
            <div className="flex items-center justify-between gap-2 p-2 border-b border-border bg-muted/30 shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatSql}
                    className="text-xs"
                >
                    Formatear SQL
                </Button>
                <Button size="sm" onClick={handleExecute} className="gap-2">
                    <Play className="size-3" />
                    Ejecutar
                </Button>
            </div>

            {/* Editor */}
            <div className="relative flex-1 min-h-0">
                <div className="absolute inset-0">
                    <CodeMirror
                        value={value}
                        onChange={onChange}
                        height="100%"
                        style={{ height: "100%" }}
                        extensions={sqlExtensions}
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            dropCursor: false,
                            allowMultipleSelections: false,
                            indentOnInput: true,
                            bracketMatching: true,
                            closeBrackets: true,
                            autocompletion: true,
                            highlightSelectionMatches: false,
                        }}
                        placeholder="SELECT * FROM users WHERE id = 1;"
                    />
                    <style>{`
                        .cm-editor,
                        .cm-content {
                            background-color: transparent !important;
                        }
                        .cm-scroller {
                            background-color: transparent !important;
                            overflow: auto !important;
                        }
                        .cm-editor .cm-content {
                            color: var(--foreground) !important;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
