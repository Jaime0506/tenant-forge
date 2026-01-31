import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Terminal } from "lucide-react";

interface ExecutionResultChipProps {
    connectionId: string;
    success: boolean;
    message: string;
}

export default function ExecutionResultChip({
    connectionId,
    success,
    message,
}: ExecutionResultChipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        transition-all duration-200 border shadow-sm cursor-pointer
                        ${success
                            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                            : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        }
                    `}
                >
                    {success ? (
                        <CheckCircle2 className="size-3 shrink-0 uppercase" />
                    ) : (
                        <XCircle className="size-3 shrink-0 uppercase" />
                    )}
                    <span className="max-w-[150px] truncate leading-none">
                        {connectionId}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-0 border border-cerulean-900/50 bg-ink-black-950/90 backdrop-blur-xl max-w-xs md:max-w-md">
                <div className="p-3 space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 font-black uppercase tracking-[0.15em] text-[10px] border-b border-white/5 pb-2 mb-1">
                        <Terminal className="size-3 text-cerulean-400" />
                        <span className={success ? "text-cerulean-100" : "text-red-400"}>
                            {success ? "Ejecución Exitosa" : "Error de Ejecución"}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-ink-black-400 font-black uppercase tracking-widest text-[9px]">Conexión:</span>
                        <code className="bg-ink-black-900 px-2 py-1.5 rounded text-[10px] font-mono border border-cerulean-800/20 break-all text-cerulean-100">
                            {connectionId}
                        </code>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-ink-black-400 font-black uppercase tracking-widest text-[9px]">Mensaje:</span>
                        <div className={`
                            p-2.5 rounded font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap border
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
