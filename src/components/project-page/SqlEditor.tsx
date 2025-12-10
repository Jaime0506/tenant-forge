import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface SqlEditorProps {
    value: string;
    onChange: (value: string) => void;
}

// Función para obtener el estilo de resaltado SQL según el tema
const getSqlHighlightStyle = (isDark: boolean): HighlightStyle => {
    console.log("isDark", isDark);

    if (isDark) {
        // Tema oscuro - colores brillantes para SQL
        return HighlightStyle.define([
            {
                tag: t.keyword,
                color: "#f87171", // Rojo/rosa claro para palabras clave SQL
                fontWeight: "600",
            },
            {
                tag: t.string,
                color: "#34d399", // Verde esmeralda para strings
            },
            {
                tag: t.comment,
                color: "#9ca3af", // Gris para comentarios
                fontStyle: "italic",
            },
            {
                tag: t.number,
                color: "#a78bfa", // Púrpura para números
            },
            {
                tag: t.operator,
                color: "#fbbf24", // Amarillo para operadores
            },
            {
                tag: t.typeName,
                color: "#fb7185", // Rosa para tipos de datos
            },
            {
                tag: t.function(t.variableName),
                color: "#22d3ee", // Cian para funciones
            },
        ]);
    } else {
        // Tema claro - colores oscuros con buen contraste
        return HighlightStyle.define([
            {
                tag: t.keyword,
                color: "#dc2626", // Rojo oscuro para palabras clave SQL
                fontWeight: "600",
            },
            {
                tag: t.string,
                color: "#059669", // Verde oscuro para strings
            },
            {
                tag: t.comment,
                color: "#6b7280", // Gris oscuro para comentarios
                fontStyle: "italic",
            },
            {
                tag: t.number,
                color: "#7c3aed", // Púrpura oscuro para números
            },
            {
                tag: t.operator,
                color: "#d97706", // Naranja oscuro para operadores
            },
            {
                tag: t.typeName,
                color: "#b91c1c", // Rojo más oscuro para tipos de datos
            },
            {
                tag: t.function(t.variableName),
                color: "#0891b2", // Cian oscuro para funciones
            },
        ]);
    }
};

// Extensión de tema personalizado para SQL
const getSqlTheme = (isDark: boolean) => EditorView.theme({
    "&": {
        fontSize: "14px",
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
        height: "100%",
    },
    ".cm-content": {
        padding: "16px",
        minHeight: "100%",
        color: "var(--foreground)",
        backgroundColor: "transparent !important",
    },
    ".cm-editor": {
        height: "100%",
        backgroundColor: "transparent !important",
    },
    ".cm-scroller": {
        overflow: "auto",
        backgroundColor: "transparent !important",
    },
    ".cm-focused": {
        outline: "none",
    },
    ".cm-editor.cm-focused": {
        outline: "none",
    },
    ".cm-placeholder": {
        color: "var(--muted-foreground)",
    },
    ".cm-selectionBackground": {
        backgroundColor: "var(--accent)",
    },
    ".cm-cursor": {
        borderLeftColor: "var(--foreground)",
    },
    ".cm-gutters": {
        backgroundColor: "transparent !important",
        border: "none",
    },
    ".cm-line": {
        color: "var(--foreground)",
    },
    ".cm-activeLine": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
    },
    // Estilos para el autocompletado
    ".cm-tooltip-autocomplete": {
        backgroundColor: isDark ? "hsl(var(--popover))" : "#ffffff",
        border: `1px solid ${isDark ? "hsl(var(--border))" : "#e5e7eb"}`,
        borderRadius: "8px",
        boxShadow: isDark
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
        padding: "6px",
        maxHeight: "300px",
        overflowY: "auto",
    },
    ".cm-completionLabel": {
        color: isDark ? "hsl(var(--foreground))" : "#1f2937",
        fontSize: "14px",
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
        fontWeight: "500",
        padding: "4px 8px",
    },
    ".cm-completionDetail": {
        color: isDark ? "hsl(var(--muted-foreground))" : "#6b7280",
        fontSize: "12px",
        fontStyle: "italic",
    },
    ".cm-completionIcon": {
        color: isDark ? "var(--muted-foreground)" : "#9ca3af",
        fontSize: "16px",
    },
    ".cm-completionIcon-keyword": {
        color: isDark ? "#f87171" : "#dc2626",
    },
    ".cm-completionIcon-function": {
        color: isDark ? "#22d3ee" : "#0891b2",
    },
    ".cm-completionIcon-type": {
        color: isDark ? "#fb7185" : "#b91c1c",
    },
    ".cm-completionIcon-variable": {
        color: isDark ? "#34d399" : "#059669",
    },
    ".cm-completionMatchedText": {
        backgroundColor: isDark ? "rgba(248, 113, 113, 0.25)" : "rgba(220, 38, 38, 0.15)",
        color: isDark ? "#fca5a5" : "#dc2626",
        fontWeight: "700",
        textDecoration: "none",
    },
    ".cm-completionLabel.cm-completionLabel-selected": {
        backgroundColor: isDark ? "hsl(var(--accent))" : "#e5e7eb",
        color: isDark ? "hsl(var(--accent-foreground))" : "#111827",
    },
    ".cm-completionLabel.cm-completionLabel-selected .cm-completionMatchedText": {
        backgroundColor: isDark ? "rgba(248, 113, 113, 0.4)" : "rgba(220, 38, 38, 0.25)",
        color: isDark ? "#fee2e2" : "#991b1b",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: isDark ? "rgba(248, 113, 113, 0.4)" : "#e5e7eb",
        color: isDark ? "hsl(var(--accent-foreground))" : "#111827",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected] .cm-completionLabel": {
        backgroundColor: isDark ? "hsl(var(--accent))" : "#e5e7eb",
        color: isDark ? "hsl(var(--accent-foreground))" : "#111827",
    },
    ".cm-completionList": {
        maxHeight: "300px",
    },
});

// Función para formatear SQL básico
const formatSql = (sql: string): string => {
    let formatted = sql
        .replace(/\s+/g, " ")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s*\(\s*/g, " (")
        .replace(/\s*\)\s*/g, ") ")
        .trim();

    // Agregar saltos de línea después de palabras clave importantes
    const keywordsWithNewline = ["SELECT", "FROM", "WHERE", "JOIN", "ORDER BY", "GROUP BY", "HAVING", "INSERT", "UPDATE", "DELETE"];
    keywordsWithNewline.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        formatted = formatted.replace(regex, `\n${keyword}`);
    });

    formatted = formatted.replace(/\n\n+/g, "\n").trim();
    return formatted;
};

export default function SqlEditor({ value, onChange }: SqlEditorProps) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detectar tema actual
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains("dark"));
        };

        // Verificar al montar
        checkTheme();

        // Observar cambios en el tema
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        // También escuchar cambios en la preferencia del sistema
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => checkTheme();
        mediaQuery.addEventListener("change", handleChange);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

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
        // Por ahora no hace nada
        console.log("Ejecutando SQL:", value);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Barra de herramientas */}
            <div className="flex items-center justify-between gap-2 p-2 border-b border-border bg-muted/30">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatSql}
                    className="text-xs"
                >
                    Formatear SQL
                </Button>
                <Button
                    size="sm"
                    onClick={handleExecute}
                    className="gap-2"
                >
                    <Play className="size-3" />
                    Ejecutar
                </Button>
            </div>

            {/* Editor */}
            <div className="relative flex-1 overflow-hidden">
                <CodeMirror
                    value={value}
                    onChange={onChange}
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
                    .cm-scroller,
                    .cm-content {
                        background-color: transparent !important;
                    }
                    .cm-editor .cm-content {
                        color: var(--foreground) !important;
                    }
                `}</style>
            </div>
        </div>
    );
}
