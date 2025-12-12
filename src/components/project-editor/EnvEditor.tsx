import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { getUniqueConnections, DatabaseConnection } from "./envParser";
import { envParser, getEnvHighlightStyle, getEnvTheme } from "./envEditorTheme";
import { useThemeDetector } from "@/hooks/useThemeDetector";

interface EnvEditorProps {
    value: string;
    onChange: (value: string) => void;
    onConfirm?: (connections: DatabaseConnection[]) => void;
}

export default function EnvEditor({
    value,
    onChange,
    onConfirm,
}: EnvEditorProps) {
    const isDark = useThemeDetector();

    // Crear extensiones dinámicamente según el tema
    const envExtensions: Extension[] = [
        envParser,
        syntaxHighlighting(getEnvHighlightStyle(isDark)),
        getEnvTheme(isDark),
        EditorView.lineWrapping,
    ];

    const handleConfirm = () => {
        const connections = getUniqueConnections(value);
        onConfirm?.(connections);
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            {/* Editor */}
            <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                    <CodeMirror
                        value={value}
                        onChange={onChange}
                        height="100%"
                        style={{ height: "100%" }}
                        extensions={envExtensions}
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            dropCursor: false,
                            allowMultipleSelections: false,
                            indentOnInput: false,
                            bracketMatching: false,
                            closeBrackets: false,
                            autocompletion: false,
                            highlightSelectionMatches: false,
                        }}
                        placeholder="DATABASE_URL=postgresql://user:password@localhost:5432/dbname&#10;API_KEY=your_api_key_here&#10;SECRET_KEY=your_secret_key"
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

            {/* Botón Confirmar */}
            <div className="p-3 border-t border-border bg-muted/30 shrink-0">
                <Button
                    onClick={handleConfirm}
                    className="w-full gap-2"
                    disabled={!value.trim()}
                >
                    <Check className="size-4" />
                    Confirmar
                </Button>
            </div>
        </div>
    );
}
