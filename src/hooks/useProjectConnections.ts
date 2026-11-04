import { useState, useCallback, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { DatabaseConnection, sanitizeConnection } from "@/components/project-editor/envParser";
import {
    cancelExecutionService,
    executeSqlService,
    ExecuteOptions,
    ExecutionPhase,
    ExecutionResult,
} from "@/services/execution.service";

export type RunOptions = Omit<ExecuteOptions, "executionId">;

export const useProjectConnections = () => {
    const [connections, setConnections] = useState<DatabaseConnection[]>([]);
    const [isExecutingSql, setIsExecutingSql] = useState(false);
    const [executionResults, setExecutionResults] = useState<ExecutionResult[] | null>(null);
    const [executionPhase, setExecutionPhase] = useState<ExecutionPhase | null>(null);
    const currentExecutionId = useRef<string | null>(null);

    /**
     * Maneja la confirmación de conexiones detectadas desde el editor .env.
     * Conserva displayName de las conexiones actuales al re-parsear.
     */
    const handleEnvConfirm = useCallback((detectedConnections: DatabaseConnection[]) => {
        setConnections((prev) => {
            if (prev.length === 0) return detectedConnections;
            const usedPrevIds = new Set<string>();

            return detectedConnections.map((detected) => {
                // 1. Mismo id; 2. misma config (envKey + host + port); 3. mismo envKey
                let match = prev.find((p) => !usedPrevIds.has(p.id) && p.id === detected.id);
                if (!match && detected.envKey) {
                    match = prev.find(
                        (p) =>
                            !usedPrevIds.has(p.id) &&
                            p.envKey === detected.envKey &&
                            p.host === detected.host &&
                            p.port === detected.port
                    );
                }
                if (!match && detected.envKey) {
                    match = prev.find((p) => !usedPrevIds.has(p.id) && p.envKey === detected.envKey);
                }

                if (match) {
                    usedPrevIds.add(match.id);
                    if (match.displayName) {
                        return { ...detected, displayName: match.displayName };
                    }
                }
                return detected;
            });
        });
    }, []);

    const updateConnectionDisplayName = useCallback((connectionId: string, displayName: string) => {
        setConnections((prev) => prev.map((c) => (c.id === connectionId ? { ...c, displayName } : c)));
    }, []);

    /**
     * Ejecuta SQL en las conexiones seleccionadas.
     * Si `merge` es true (reintentos), los resultados nuevos reemplazan a los
     * anteriores de esos tenants en vez de borrar la consola.
     */
    const executeSql = async (
        sql: string,
        selectedConnections: DatabaseConnection[],
        options: RunOptions,
        merge = false
    ) => {
        if (selectedConnections.length === 0) {
            console.warn("No hay conexiones seleccionadas");
            return;
        }

        const executionId = crypto.randomUUID();
        currentExecutionId.current = executionId;
        const retriedIds = new Set(selectedConnections.map((c) => c.id));
        const base = (prev: ExecutionResult[] | null) =>
            merge ? (prev ?? []).filter((r) => !retriedIds.has(String(r.connection_id))) : [];

        let buffer: ExecutionResult[] = [];
        let rafId: number | null = null;
        const unlisteners: UnlistenFn[] = [];

        const flushBuffer = () => {
            if (buffer.length > 0) {
                const toAppend = buffer;
                buffer = [];
                setExecutionResults((prev) => [...(prev ?? []), ...toAppend]);
            }
            rafId = null;
        };

        try {
            setIsExecutingSql(true);
            setExecutionPhase("running");
            setExecutionResults((prev) => base(prev));

            unlisteners.push(
                await listen<ExecutionResult[] | ExecutionResult>("sql-execution-progress", (event) => {
                    if (currentExecutionId.current !== executionId) return;
                    const items = Array.isArray(event.payload) ? event.payload : [event.payload];
                    buffer.push(...items);
                    if (rafId === null) rafId = requestAnimationFrame(flushBuffer);
                })
            );
            unlisteners.push(
                await listen<{ executionId: string; phase: ExecutionPhase }>("sql-execution-phase", (event) => {
                    if (event.payload.executionId === executionId) setExecutionPhase(event.payload.phase);
                })
            );

            const results = await executeSqlService(sql, selectedConnections.map(sanitizeConnection), {
                ...options,
                executionId,
            });

            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = null;
            buffer = [];
            setExecutionResults((prev) => [...base(prev), ...results]);
            return results;
        } catch (error) {
            console.error("Error ejecutando SQL:", error);
            setExecutionResults((prev) => [
                ...base(prev),
                {
                    connection_id: "Error",
                    success: false,
                    status: "failed",
                    message: `Error al ejecutar: ${error}`,
                },
            ]);
        } finally {
            unlisteners.forEach((u) => u());
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (currentExecutionId.current === executionId) currentExecutionId.current = null;
            setIsExecutingSql(false);
            setExecutionPhase(null);
        }
    };

    const cancelExecution = useCallback(async () => {
        const id = currentExecutionId.current;
        if (!id) return false;
        return cancelExecutionService(id);
    }, []);

    const clearResults = useCallback(() => setExecutionResults(null), []);

    return {
        connections,
        isExecutingSql,
        executionResults,
        executionPhase,
        handleEnvConfirm,
        updateConnectionDisplayName,
        executeSql,
        cancelExecution,
        clearResults,
    };
};
