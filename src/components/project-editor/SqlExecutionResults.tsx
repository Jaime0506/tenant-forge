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
        <div className="p-3 border-t border-border bg-muted/20 shrink-0">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {allSuccessful ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                        <XCircle className="size-4 text-red-500" />
                    )}
                    <span className="text-xs font-semibold text-foreground">
                        Resultados de Ejecución
                    </span>
                </div>
                <div className="bg-background/50 border border-border px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">{successful}</span> exitosas • <span className="text-red-600 dark:text-red-400">{failed}</span> fallidas
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
