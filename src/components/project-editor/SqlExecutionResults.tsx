import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";

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

    const formatResults = (): string => {
        const lines: string[] = [];
        lines.push("=== RESULTADOS DE EJECUCIÓN ===\n");

        results.forEach((result, index) => {
            const status = result.success ? "✅ ÉXITO" : "❌ ERROR";
            lines.push(`[${index + 1}] ${status} - ${result.connection_id}`);
            lines.push(`   ${result.message}`);
            lines.push("");
        });

        const successful = results.filter((r) => r.success).length;
        const failed = results.length - successful;

        lines.push("=== RESUMEN ===");
        lines.push(`Total: ${results.length}`);
        lines.push(`Exitosas: ${successful}`);
        lines.push(`Fallidas: ${failed}`);

        return lines.join("\n");
    };

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;
    const allSuccessful = failed === 0;

    return (
        <div className="p-3 border-t border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-2 mb-2">
                {allSuccessful ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                ) : (
                    <XCircle className="size-4 text-red-500" />
                )}
                <span className="text-xs font-medium text-foreground">
                    Resultados: {successful} exitosas, {failed} fallidas
                </span>
            </div>
            <Textarea
                value={formatResults()}
                readOnly
                className="font-mono text-xs min-h-[120px] max-h-[200px] resize-none bg-background"
            />
        </div>
    );
}
