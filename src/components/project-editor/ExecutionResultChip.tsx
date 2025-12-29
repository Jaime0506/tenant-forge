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
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200 border shadow-sm
                        ${success
                            ? "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-900/50"
                            : "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-900/50"
                        }
                    `}
                >
                    {success ? (
                        <CheckCircle2 className="size-3.5 shrink-0" />
                    ) : (
                        <XCircle className="size-3.5 shrink-0" />
                    )}
                    <span className="max-w-[150px] truncate">
                        {connectionId}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-0 border shadow-lg max-w-xs md:max-w-md">
                <div className="p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-sm border-b border-border pb-2 mb-1">
                        <Terminal className="size-3.5 text-muted-foreground" />
                        <span>Resultado de Ejecución</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-medium">Conexión:</span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono break-all">
                            {connectionId}
                        </code>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-medium">Mensaje:</span>
                        <div className={`
                            p-2 rounded font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap border
                            ${success
                                ? "bg-green-500/5 text-green-700 border-green-100/50 dark:text-green-400 dark:border-green-900/30"
                                : "bg-red-500/5 text-red-700 border-red-100/50 dark:text-red-400 dark:border-red-900/30"
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
