import { useState, useRef, useEffect } from "react";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Database, Check, Pencil } from "lucide-react";
import { DatabaseConnection } from "./envParser";

function connectionLabel(conn: DatabaseConnection): string {
    return conn.displayName || conn.id || conn.db || "";
}

interface ConnectionChipProps {
    connection: DatabaseConnection;
    isSelected: boolean;
    onSelect: () => void;
    onRename?: (connectionId: string, displayName: string) => void;
}

export default function ConnectionChip({
    connection,
    isSelected,
    onSelect,
    onRename,
}: ConnectionChipProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(connectionLabel(connection));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            setEditValue(connectionLabel(connection));
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing, connection.displayName, connection.db, connection.id]);

    const handleCommitRename = () => {
        setIsEditing(false);
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== connectionLabel(connection) && onRename) {
            onRename(connection.id, trimmed);
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={`
                        inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest
                        transition-all duration-200 border
                        ${isSelected
                            ? "bg-ink-black-900 text-white border-cerulean-500/40 shadow-xl"
                            : "bg-ink-black-950/40 text-ink-black-400 border-white/5 hover:bg-ink-black-900/60 hover:text-ink-black-200"
                        }
                    `}
                >
                    <button
                        type="button"
                        onClick={onSelect}
                        className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer text-left"
                    >
                        <Database className="size-3 shrink-0" />
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCommitRename}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCommitRename();
                                    if (e.key === "Escape") {
                                        setEditValue(connectionLabel(connection));
                                        setIsEditing(false);
                                        inputRef.current?.blur();
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="max-w-[100px] bg-transparent border-b border-current outline-none py-0 text-inherit placeholder:text-current/50"
                            />
                        ) : (
                            <span className="max-w-[120px] truncate">
                                {connectionLabel(connection)}
                            </span>
                        )}
                        {isSelected && !isEditing && (
                            <Check className="size-3 shrink-0" />
                        )}
                    </button>
                    {onRename && !isEditing && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            className="shrink-0 p-0.5 rounded hover:bg-white/10 focus:outline-none"
                            aria-label="Renombrar conexión"
                        >
                            <Pencil className="size-3" />
                        </button>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-0">
                <div className="p-3 space-y-1.5 text-xs">
                    <div className="font-semibold text-sm border-b border-border pb-1.5 mb-2">
                        Información de conexión
                    </div>
                    {connection.db && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">DB:</span>
                            <span className="font-mono">{connection.db}</span>
                        </div>
                    )}
                    {connection.schema && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                                Schema:
                            </span>
                            <span className="font-mono">
                                {connection.schema}
                            </span>
                        </div>
                    )}
                    {connection.host && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Host:</span>
                            <span className="font-mono">{connection.host}</span>
                        </div>
                    )}
                    {connection.port && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Port:</span>
                            <span className="font-mono">{connection.port}</span>
                        </div>
                    )}
                    {connection.user && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">User:</span>
                            <span className="font-mono">{connection.user}</span>
                        </div>
                    )}
                    {connection.type && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-mono">{connection.type}</span>
                        </div>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
