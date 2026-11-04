import { invoke } from "@tauri-apps/api/core";
import { DatabaseConnection } from "@/components/project-editor/envParser";

export type ExecutionMode = "all_or_nothing" | "independent" | "dry_run";

export type TenantStatus = "committed" | "rolled_back" | "failed" | "skipped" | "cancelled";

export interface ResultSet {
    columns: string[];
    rows: (string | null)[][];
    truncated: boolean;
}

export interface ExecutionResult {
    connection_id: string;
    success: boolean;
    message: string;
    status?: TenantStatus;
    duration_ms?: number;
    rows_affected?: number | null;
    result_sets?: ResultSet[];
}

export type ExecutionPhase = "running" | "committing" | "rolling_back" | "done";

export interface ProjectSettings {
    concurrency: number;
    statementTimeoutMs: number;
    lockTimeoutMs: number;
    defaultMode: ExecutionMode;
    maxRows: number;
}

export const DEFAULT_SETTINGS: ProjectSettings = {
    concurrency: 12,
    statementTimeoutMs: 0,
    lockTimeoutMs: 0,
    defaultMode: "independent",
    maxRows: 500,
};

export function parseSettings(raw: string | undefined | null): ProjectSettings {
    if (!raw) return { ...DEFAULT_SETTINGS };
    try {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...(typeof parsed === "object" && parsed ? parsed : {}) };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export const MODE_LABELS: Record<ExecutionMode, { label: string; hint: string }> = {
    independent: {
        label: "Independiente",
        hint: "Cada tenant confirma por su cuenta. Si uno falla, los demás quedan aplicados.",
    },
    all_or_nothing: {
        label: "Todo o nada",
        hint: "Solo se confirma si todos los tenants terminan bien; si uno falla, se revierte en todos.",
    },
    dry_run: {
        label: "Dry-run",
        hint: "Ejecuta y revierte siempre. Sirve para validar el script sin aplicar nada.",
    },
};

export interface ExecuteOptions {
    executionId: string;
    projectId?: number;
    mode: ExecutionMode;
    concurrency?: number;
    statementTimeoutMs?: number;
    lockTimeoutMs?: number;
    maxRows?: number;
    trackMigration: boolean;
    force: boolean;
    scriptName?: string;
}

export const executeSqlService = (
    sql: string,
    connections: DatabaseConnection[],
    options: ExecuteOptions
) => invoke<ExecutionResult[]>("execute_sql", { sql, connections, options });

export const cancelExecutionService = (executionId: string) =>
    invoke<boolean>("cancel_execution", { executionId });

export interface MigrationStatus {
    connectionId: string;
    state: "applied" | "pending" | "error";
    appliedAt?: string | null;
    message?: string | null;
}

export const getMigrationStatusService = (sql: string, connections: DatabaseConnection[]) =>
    invoke<MigrationStatus[]>("get_migration_status", { sql, connections });

export interface ExecutionSummary {
    id: string;
    projectId: number | null;
    scriptHash: string;
    sql: string;
    mode: ExecutionMode;
    startedAt: string;
    finishedAt: string | null;
    total: number;
    ok: number;
    failed: number;
    cancelled: number;
}

export interface ExecutionDetail extends ExecutionSummary {
    results: {
        connectionId: string;
        status: TenantStatus;
        message: string;
        durationMs: number | null;
        rowsAffected: number | null;
    }[];
}

export const listExecutionsService = (projectId: number, limit = 50) =>
    invoke<ExecutionSummary[]>("list_executions", { projectId, limit });

export const getExecutionService = (id: string) =>
    invoke<ExecutionDetail | null>("get_execution", { id });

export const saveProjectSettingsService = (id: number, settings: ProjectSettings) =>
    invoke<void>("save_project_settings", { id, settings });
