import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Database, Check } from "lucide-react";
import { DatabaseConnection } from "./envParser";

interface ConnectionChipProps {
    connection: DatabaseConnection;
    isSelected: boolean;
    onSelect: () => void;
}

export default function ConnectionChip({
    connection,
    isSelected,
    onSelect,
}: ConnectionChipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onSelect}
                    className={`
                        inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest
                        transition-all duration-200 cursor-pointer border
                        ${isSelected
                            ? "bg-ink-black-900 text-white border-cerulean-500/40 shadow-xl"
                            : "bg-ink-black-950/40 text-ink-black-400 border-white/5 hover:bg-ink-black-900/60 hover:text-ink-black-200"
                        }
                    `}
                >
                    <Database className="size-3 shrink-0" />
                    <span className="max-w-[120px] truncate">
                        {connection.db || connection.id}
                    </span>
                    {isSelected && <Check className="size-3 shrink-0" />}
                </button>
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
