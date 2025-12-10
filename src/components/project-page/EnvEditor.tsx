import { useRef, useEffect } from "react";

interface EnvEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function EnvEditor({ value, onChange }: EnvEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textareaRef.current || !highlightRef.current) return;

        const textarea = textareaRef.current;
        const highlight = highlightRef.current;

        // Sincronizar scroll
        const syncScroll = () => {
            highlight.scrollTop = textarea.scrollTop;
            highlight.scrollLeft = textarea.scrollLeft;
        };

        textarea.addEventListener("scroll", syncScroll);
        return () => textarea.removeEventListener("scroll", syncScroll);
    }, []);

    // Función para resaltar el texto antes del "="
    const highlightEnv = (text: string) => {
        const lines = text.split("\n");
        return lines
            .map((line) => {
                // Si la línea tiene un "=" y no es un comentario
                if (line.includes("=") && !line.trim().startsWith("#")) {
                    const [key, ...rest] = line.split("=");
                    const value = rest.join("=");
                    return `<span class="text-green-600 dark:text-green-400 font-medium">${escapeHtml(key)}</span>=${escapeHtml(value)}`;
                }
                return escapeHtml(line);
            })
            .join("\n");
    };

    const escapeHtml = (text: string) => {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    };

    return (
        <div className="relative h-full w-full">
            {/* Textarea transparente */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full resize-none bg-transparent text-foreground px-4 py-3 font-mono text-sm leading-relaxed caret-foreground z-10 border-0 outline-none"
                placeholder="DATABASE_URL=postgresql://user:password@localhost:5432/dbname&#10;API_KEY=your_api_key_here&#10;SECRET_KEY=your_secret_key"
                spellCheck={false}
            />
            {/* Overlay de resaltado */}
            <div
                ref={highlightRef}
                className="absolute inset-0 w-full h-full px-4 py-3 font-mono text-sm leading-relaxed pointer-events-none overflow-auto whitespace-pre-wrap wrap-break-word"
                dangerouslySetInnerHTML={{
                    __html: highlightEnv(value || ""),
                }}
            />
        </div>
    );
}

