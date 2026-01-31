import { CheckCircle2, XCircle } from "lucide-react";
import ExecutionResultChip from "./ExecutionResultChip";
import type { DatabaseConnection } from "./envParser";

interface ExecutionResult {
    connection_id: string;
    success: boolean;
    message: string;
}

function connectionDisplayLabel(conn: DatabaseConnection): string {
    return conn.displayName || conn.db || conn.id || "";
}

interface SqlExecutionResultsProps {
    results: ExecutionResult[] | null;
    connections?: DatabaseConnection[];
}

export default function SqlExecutionResults({
    results,
    connections = [],
}: SqlExecutionResultsProps) {
    if (!results || results.length === 0) {
        return null;
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;
    const allSuccessful = failed === 0;

    return (
        <div className="p-3 border-t border-cerulean-500/10 bg-ink-black-950/40 backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {allSuccessful ? (
                        <CheckCircle2 className="size-3 text-green-400" />
                    ) : (
                        <XCircle className="size-3 text-red-400" />
                    )}
                    <span className="text-xs font-black text-cerulean-100 uppercase tracking-[0.2em]">
                        Resultados de Ejecución
                    </span>
                </div>
                <div className="bg-ink-black-900 border border-cerulean-900/50 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-cerulean-100">
                    <span className="text-green-400">{successful}</span> <span className="text-ink-black-400 mx-1">/</span> <span className="text-white">{results.length}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pt-1 pb-2">
                {results.map((result, index) => {
                    const conn = connections.find(
                        (c) => c.id === result.connection_id
                    );
                    const displayName = conn
                        ? connectionDisplayLabel(conn)
                        : undefined;
                    return (
                        <ExecutionResultChip
                            key={`${result.connection_id}-${index}`}
                            connectionId={result.connection_id}
                            displayName={displayName}
                            success={result.success}
                            message={result.message}
                        />
                    );
                })}
            </div>
        </div>
    );
}
