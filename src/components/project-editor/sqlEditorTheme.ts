import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * Obtiene el estilo de resaltado SQL según el tema
 */
export const getSqlHighlightStyle = (isDark: boolean): HighlightStyle => {
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

/**
 * Extensión de tema personalizado para SQL
 */
export const getSqlTheme = (isDark: boolean) =>
    EditorView.theme({
        "&": {
            fontSize: "14px",
            fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
            height: "100%",
        },
        ".cm-content": {
            padding: "16px",
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
            backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : "rgba(0, 0, 0, 0.06)",
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
            fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
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
            backgroundColor: isDark
                ? "rgba(248, 113, 113, 0.25)"
                : "rgba(220, 38, 38, 0.15)",
            color: isDark ? "#fca5a5" : "#dc2626",
            fontWeight: "700",
            textDecoration: "none",
        },
        ".cm-completionLabel.cm-completionLabel-selected": {
            backgroundColor: isDark ? "hsl(var(--accent))" : "#e5e7eb",
            color: isDark ? "hsl(var(--accent-foreground))" : "#111827",
        },
        ".cm-completionLabel.cm-completionLabel-selected .cm-completionMatchedText":
            {
                backgroundColor: isDark
                    ? "rgba(248, 113, 113, 0.4)"
                    : "rgba(220, 38, 38, 0.25)",
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
        ".cm-searchPanel": {
            display: "none !important",
        },
    });
