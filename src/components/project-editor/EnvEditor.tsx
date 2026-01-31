import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import { getUniqueConnections, DatabaseConnection } from "./envParser";
import { envParser, getEnvHighlightStyle, getEnvTheme } from "./envEditorTheme";
import { useThemeDetector } from "@/hooks/useThemeDetector";
import { useState } from "react";
import { useProjectService } from "@/hooks/useProjectService";
import { toast } from "sonner";
import ButtonCustom from "../ui-custom/ButtonCustom";

interface EnvEditorProps {
    value: string;
    onChange: (value: string) => void;
    onConfirm?: (connections: DatabaseConnection[]) => void;
    projectId?: number;
    onSaveComplete?: () => void;
}

export default function EnvEditor({
    value,
    onChange,
    onConfirm,
    projectId,
    onSaveComplete,
}: EnvEditorProps) {
    const isDark = useThemeDetector();
    const [isSaving, setIsSaving] = useState(false);
    const { saveProject } = useProjectService();

    // Crear extensiones dinámicamente según el tema
    const envExtensions: Extension[] = [
        envParser,
        syntaxHighlighting(getEnvHighlightStyle(isDark)),
        getEnvTheme(isDark),
        EditorView.lineWrapping,
    ];

    /**
     * Limpia todas las comillas (simples y dobles, normales y Unicode) de un string
     * Maneja casos con comillas anidadas o múltiples capas
     */
    const cleanQuotes = (value: string | undefined): string | undefined => {
        if (!value) return value;

        let cleaned = value.trim();
        let iterations = 0;
        const maxIterations = 10; // Límite de seguridad

        // Iterar hasta que no haya más cambios (elimina comillas anidadas)
        while (iterations < maxIterations) {
            const before = cleaned;

            // Eliminar todas las variantes de comillas simples del inicio y final
            // Incluye: ' (normal), ' (left single), ' (right single)
            cleaned = cleaned.replace(/^['''']+/g, "").replace(/['''']+$/g, "");

            // Eliminar todas las variantes de comillas dobles del inicio y final
            // Incluye: " (normal), " (left double), " (right double)
            cleaned = cleaned.replace(/^[""""]+/g, "").replace(/[""""]+$/g, "");

            // Si no hubo cambios, salir
            if (before === cleaned) {
                break;
            }

            iterations++;
        }

        return cleaned.trim();
    };

    const handleConfirm = () => {
        const connections = getUniqueConnections(value);
        onConfirm?.(connections);
    };

    const handleSave = async () => {
        if (!value.trim()) {
            toast.error("No hay contenido para guardar");
            return;
        }

        if (!projectId) {
            toast.error("No se ha especificado el ID del proyecto");
            return;
        }

        try {
            setIsSaving(true);

            // Parsear las conexiones del contenido .env
            const connections = getUniqueConnections(value);

            if (connections.length === 0) {
                toast.error("No se encontraron conexiones válidas en el archivo .env");
                setIsSaving(false);
                return;
            }

            // Limpiar las comillas de las conexiones
            const fixedConnections = connections.map((connection) => {
                const fixedConnection: DatabaseConnection = {
                    id: cleanQuotes(connection.id) || connection.id,
                    type: cleanQuotes(connection.type),
                    host: cleanQuotes(connection.host),
                    db: cleanQuotes(connection.db),
                    schema: cleanQuotes(connection.schema),
                    user: cleanQuotes(connection.user),
                    password: cleanQuotes(connection.password),
                    port: connection.port,
                };

                return fixedConnection;
            });

            // Guardar el proyecto con las conexiones (sin ejecutar SQL)
            await saveProject(projectId, fixedConnections);
            toast.success("Proyecto guardado exitosamente");

            onSaveComplete?.();
        } catch (error) {
            console.error("Error guardando proyecto:", error);
            toast.error(`Error al guardar: ${error}`);
        } finally {
            setIsSaving(false);
        }
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
                        placeholder="POSTGRES_TYPE_MY_CONNECTION = 'postgres'&#10;POSTGRES_HOST_MY_CONNECTION = 'localhost'&#10;POSTGRES_DB_MY_CONNECTION = 'database_name'&#10;POSTGRES_SCHEMA_MY_CONNECTION = 'public'&#10;POSTGRES_USER_MY_CONNECTION = 'username'&#10;POSTGRES_PASSWORD_MY_CONNECTION = 'password'&#10;POSTGRES_PORT_MY_CONNECTION = 5432&#10;&#10;POSTGRES_TYPE_ANOTHER_CONNECTION = 'postgres'&#10;POSTGRES_HOST_ANOTHER_CONNECTION = '192.168.1.100'&#10;POSTGRES_DB_ANOTHER_CONNECTION = 'another_db'&#10;POSTGRES_SCHEMA_ANOTHER_CONNECTION = 'schema_name'&#10;POSTGRES_USER_ANOTHER_CONNECTION = 'user2'&#10;POSTGRES_PASSWORD_ANOTHER_CONNECTION = 'pass2'&#10;POSTGRES_PORT_ANOTHER_CONNECTION = 5432"
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
            <div className="flex flex-row gap-2 p-3 border-t border-cerulean-500/10 bg-ink-black-900/60 backdrop-blur-md shrink-0">
                <Button
                    onClick={handleConfirm}
                    className="flex-1 gap-2.5 border border-cerulean-500/20 text-cerulean-300 hover:bg-cerulean-500/20 hover:text-white rounded-xl h-auto px-6 py-3 font-black uppercase tracking-widest text-xs transition-all cursor-pointer"
                    disabled={!value.trim()}
                >
                    <Check className="size-4" />
                    Confirmar
                </Button>
                <ButtonCustom
                    isLoading={isSaving}
                    onClick={handleSave}
                    className="flex-1 gap-2.5 bg-cerulean-600 hover:bg-cerulean-500 text-ink-black-950 font-black uppercase tracking-widest text-xs rounded-xl h-auto px-6 py-3 border-none shadow-[0_0_20px_rgba(8,191,247,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                    disabled={!value.trim() || isSaving || !projectId}
                >
                    <Save className="size-4" />
                    Guardar
                </ButtonCustom>
            </div>
        </div>
    );
}
