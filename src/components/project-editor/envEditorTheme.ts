import { EditorView } from "@codemirror/view";
import { StreamLanguage, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * Parser para archivos .env
 */
export const envParser = StreamLanguage.define({
    name: "env",
    token: (stream) => {
        // Comentarios (líneas que empiezan con #)
        if (stream.match(/^#.*/)) {
            return "comment";
        }

        // Saltos de línea
        if (stream.eol()) {
            stream.next();
            return null;
        }

        // Espacios
        if (stream.eatWhile(/^\s/)) {
            return null;
        }

        // Clave (texto antes del =, puede tener letras, números, guiones bajos)
        if (stream.match(/^[A-Z_][A-Z0-9_]*/i)) {
            return "variableName";
        }

        // Operador =
        if (stream.match(/^=/)) {
            return "operator";
        }

        // Strings entre comillas simples
        if (stream.match(/^'[^']*'/)) {
            return "string";
        }

        // Strings entre comillas dobles
        if (stream.match(/^"[^"]*"/)) {
            return "string";
        }

        // Números
        if (stream.match(/^\d+/)) {
            return "number";
        }

        // Cualquier otro carácter (valores sin comillas)
        stream.next();
        return "string";
    },
});

/**
 * Obtiene el estilo de resaltado según el tema
 */
export const getEnvHighlightStyle = (isDark: boolean): HighlightStyle => {
    if (isDark) {
        // Tema oscuro - colores brillantes
        return HighlightStyle.define([
            {
                tag: t.variableName,
                color: "#7dd3fc", // Azul claro para claves
                fontWeight: "500",
            },
            {
                tag: t.string,
                color: "#86efac", // Verde para valores/strings
            },
            {
                tag: t.comment,
                color: "#9ca3af", // Gris para comentarios
                fontStyle: "italic",
            },
            {
                tag: t.operator,
                color: "#ffffff", // Blanco para el =
            },
            {
                tag: t.number,
                color: "#c084fc", // Púrpura para números
            },
        ]);
    } else {
        // Tema claro - colores oscuros con buen contraste
        return HighlightStyle.define([
            {
                tag: t.variableName,
                color: "#0284c7", // Azul oscuro para claves
                fontWeight: "500",
            },
            {
                tag: t.string,
                color: "#16a34a", // Verde oscuro para valores/strings
            },
            {
                tag: t.comment,
                color: "#6b7280", // Gris oscuro para comentarios
                fontStyle: "italic",
            },
            {
                tag: t.operator,
                color: "#1f2937", // Gris muy oscuro para el =
            },
            {
                tag: t.number,
                color: "#9333ea", // Púrpura oscuro para números
            },
        ]);
    }
};

/**
 * Extensión de tema personalizado para .env
 */
export const getEnvTheme = (isDark: boolean) =>
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
            overflow: "auto !important",
            backgroundColor: "transparent !important",
            height: "100%",
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
    });
