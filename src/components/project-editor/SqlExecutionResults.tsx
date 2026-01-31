import { CheckCircle2, XCircle } from "lucide-react";
import ExecutionResultChip from "./ExecutionResultChip";

interface ExecutionResult {
    connection_id: string;
    success: boolean;
    message: string;
}

interface SqlExecutionResultsProps {
    results: ExecutionResult[] | null;
}

export default function SqlExecutionResults({
    results,
}: SqlExecutionResultsProps) {
    if (!results || results.length === 0) {
        return null;
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;
    const allSuccessful = failed === 0;

    return (
        <div className="p-3 border-t border-cerulean-500/10 bg-ink-black-950/20 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {allSuccessful ? (
                        <CheckCircle2 className="size-3 text-green-400" />
                    ) : (
                        <XCircle className="size-3 text-red-400" />
                    )}
                    <span className="text-[10px] font-black text-cerulean-500 uppercase tracking-[0.2em]">
                        Resultados de Ejecución
                    </span>
                </div>
                <div className="bg-ink-black-950/50 border border-cerulean-500/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-cerulean-300">
                    <span className="text-green-400">{successful}</span> exitosas • <span className="text-red-400">{failed}</span> fallidas
                </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pt-1 pb-2">
                {results.map((result, index) => (
                    <ExecutionResultChip
                        key={`${result.connection_id}-${index}`}
                        connectionId={result.connection_id}
                        success={result.success}
                        message={result.message}
                    />
                ))}
            </div>
        </div>
    );
}
