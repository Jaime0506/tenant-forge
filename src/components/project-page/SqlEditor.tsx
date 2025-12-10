import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface SqlEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function SqlEditor({ value, onChange }: SqlEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textareaRef.current || !highlightRef.current) return;

        const textarea = textareaRef.current;
        const highlight = highlightRef.current;

        const syncScroll = () => {
            highlight.scrollTop = textarea.scrollTop;
            highlight.scrollLeft = textarea.scrollLeft;
        };

        textarea.addEventListener("scroll", syncScroll);
        return () => textarea.removeEventListener("scroll", syncScroll);
    }, []);

    // Palabras clave SQL de PostgreSQL
    const sqlKeywords = [
        "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE",
        "ALTER", "DROP", "TABLE", "DATABASE", "INDEX", "VIEW", "TRIGGER",
        "FUNCTION", "PROCEDURE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL",
        "OUTER", "ON", "AS", "AND", "OR", "NOT", "IN", "EXISTS", "LIKE",
        "BETWEEN", "IS", "NULL", "ORDER", "BY", "GROUP", "HAVING", "LIMIT",
        "OFFSET", "DISTINCT", "UNION", "ALL", "CASE", "WHEN", "THEN", "ELSE",
        "END", "CAST", "COUNT", "SUM", "AVG", "MAX", "MIN", "INTEGER",
        "VARCHAR", "TEXT", "BOOLEAN", "DATE", "TIMESTAMP", "DECIMAL",
        "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CONSTRAINT", "UNIQUE",
        "DEFAULT", "NOT NULL", "RETURNS", "RETURN", "BEGIN", "END", "IF",
        "ELSEIF", "LOOP", "FOR", "WHILE", "RAISE", "EXCEPTION"
    ];

    // Función para formatear SQL básico
    const formatSql = () => {
        let formatted = value
            .replace(/\s+/g, " ")
            .replace(/\s*,\s*/g, ", ")
            .replace(/\s*\(\s*/g, " (")
            .replace(/\s*\)\s*/g, ") ")
            .trim();

        // Agregar saltos de línea después de palabras clave importantes
        const keywordsWithNewline = ["SELECT", "FROM", "WHERE", "JOIN", "ORDER BY", "GROUP BY"];
        keywordsWithNewline.forEach((keyword) => {
            const regex = new RegExp(`\\b${keyword}\\b`, "gi");
            formatted = formatted.replace(regex, `\n${keyword}`);
        });

        formatted = formatted.replace(/\n\n+/g, "\n").trim();
        onChange(formatted);
    };

    // Función para resaltar SQL
    const highlightSql = (text: string) => {
        if (!text) return "";

        let highlighted = escapeHtml(text);

        // Resaltar palabras clave SQL
        sqlKeywords.forEach((keyword) => {
            const regex = new RegExp(`\\b${keyword}\\b`, "gi");
            highlighted = highlighted.replace(
                regex,
                `<span class="text-blue-600 dark:text-blue-400 font-semibold">${keyword.toUpperCase()}</span>`
            );
        });

        // Resaltar strings (entre comillas simples o dobles)
        highlighted = highlighted.replace(
            /(['"])((?:(?=(\\?))\3.)*?)\1/g,
            '<span class="text-green-600 dark:text-green-400">$1$2$1</span>'
        );

        // Resaltar números
        highlighted = highlighted.replace(
            /\b\d+\.?\d*\b/g,
            '<span class="text-purple-600 dark:text-purple-400">$&</span>'
        );

        // Resaltar comentarios (-- y /* */)
        highlighted = highlighted.replace(
            /--.*$/gm,
            '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
        );
        highlighted = highlighted.replace(
            /\/\*[\s\S]*?\*\//g,
            '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
        );

        return highlighted;
    };

    const escapeHtml = (text: string) => {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
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
                    onClick={formatSql}
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
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full resize-none bg-transparent text-foreground px-4 py-3 font-mono text-sm leading-relaxed caret-foreground z-10 border-0 outline-none"
                    placeholder="SELECT * FROM users WHERE id = 1;"
                    spellCheck={false}
                />
                <div
                    ref={highlightRef}
                    className="absolute inset-0 w-full h-full px-4 py-3 font-mono text-sm leading-relaxed pointer-events-none overflow-auto whitespace-pre-wrap wrap-break-word"
                    dangerouslySetInnerHTML={{
                        __html: highlightSql(value || ""),
                    }}
                />
            </div>
        </div>
    );
}

