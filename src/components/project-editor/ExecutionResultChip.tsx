import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Terminal } from "lucide-react";

interface ExecutionResultChipProps {
    connectionId: string;
    displayName?: string;
    success: boolean;
    message: string;
}

export default function ExecutionResultChip({
    connectionId,
    displayName,
    success,
    message,
}: ExecutionResultChipProps) {
    const label = displayName ?? connectionId;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest
                        transition-all duration-200 border shadow-sm cursor-pointer
                        ${success
                            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                            : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        }
                    `}
                >
                    {success ? (
                        <CheckCircle2 className="size-3.5 shrink-0 uppercase" />
                    ) : (
                        <XCircle className="size-3.5 shrink-0 uppercase" />
                    )}
                    <span className="max-w-[150px] truncate leading-none">
                        {label}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-0 border border-cerulean-900/50 bg-ink-black-950/90 backdrop-blur-xl max-w-xs md:max-w-md">
                <div className="p-3 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-black uppercase tracking-[0.15em] text-[11px] border-b border-white/5 pb-2.5 mb-1.5">
                        <Terminal className="size-3.5 text-cerulean-400" />
                        <span className={success ? "text-cerulean-100" : "text-red-400"}>
                            {success ? "Ejecución Exitosa" : "Error de Ejecución"}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-ink-black-400 font-black uppercase tracking-widest text-[10px]">Conexión:</span>
                        <code className="bg-ink-black-900 px-2 py-1.5 rounded text-xs font-mono border border-cerulean-800/20 break-all text-cerulean-100">
                            {displayName != null && displayName !== connectionId
                                ? `${displayName} (${connectionId})`
                                : connectionId}
                        </code>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-ink-black-400 font-black uppercase tracking-widest text-[10px]">Mensaje:</span>
                        <div className={`
                            p-3 rounded font-mono text-xs leading-relaxed break-all whitespace-pre-wrap border
                            ${success
                                ? "bg-ink-black-900/50 text-cerulean-100 border-cerulean-800/20"
                                : "bg-red-500/5 text-red-200 border-red-900/30"
                            }
                        `}>
                            {success ? "TODO HA SIDO EJECUTADO CORRECTAMENTE." : message}
                        </div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
