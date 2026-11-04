import { useState, useMemo, useEffect, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { DatabaseConnection } from "./envParser";
import { ExecutionPhase, ExecutionResult } from "@/services/execution.service";
import { StatusIcon } from "./ExecutionHistoryDialog";
import { CompareView, ResultTable } from "./ResultSetView";

export type { ExecutionResult };

/** Un resultado cuenta como fallido si falló de verdad (no si fue revertido o cancelado). */
const isFailed = (r: ExecutionResult) => !r.success && (r.status === undefined || r.status === "failed");
const isNeutral = (r: ExecutionResult) => !r.success && (r.status === "rolled_back" || r.status === "cancelled");

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  committed: { label: "COMMIT", cls: "bg-success/15 text-success border-success/30" },
  skipped: { label: "OMITIDO", cls: "bg-cerulean-500/15 text-cerulean-300 border-cerulean-500/30" },
  rolled_back: { label: "REVERTIDO", cls: "bg-warning/15 text-warning border-warning/30" },
  cancelled: { label: "CANCELADO", cls: "bg-surface-3 text-muted-foreground border-surface-border" },
  failed: { label: "ERROR", cls: "bg-error/15 text-error border-error/30" },
};

const PHASE_LABEL: Record<ExecutionPhase, string> = {
  running: "Ejecutando",
  committing: "Confirmando en todos",
  rolling_back: "Revirtiendo en todos",
  done: "Finalizado",
};

interface SqlExecutionInspectorProps {
  results: ExecutionResult[] | null;
  connections?: DatabaseConnection[];
  isExecuting?: boolean;
  phase?: ExecutionPhase | null;
  onRetryConnection?: (connection: DatabaseConnection) => void;
  onRetryFailed?: (connections: DatabaseConnection[]) => void;
  onClear?: () => void;
}

export default function SqlExecutionInspector({
  results,
  connections = [],
  isExecuting = false,
  phase = null,
  onRetryConnection,
  onRetryFailed,
  onClear,
}: SqlExecutionInspectorProps) {
  const [detailTab, setDetailTab] = useState<"detail" | "rows">("detail");
  const [compareMode, setCompareMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "failed" | "success">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const prevResultsRef = useRef<ExecutionResult[] | null>(null);

  // Map connections by ID for fast lookup
  const connectionMap = useMemo(() => {
    const map = new Map<string, DatabaseConnection>();
    if (Array.isArray(connections)) {
      connections.forEach((c) => {
        if (c && c.id != null) map.set(String(c.id), c);
      });
    }
    return map;
  }, [connections]);

  const { successfulCount, failedCount, neutralCount, totalCount, hasFailures } = useMemo(() => {
    if (!results || !Array.isArray(results)) {
      return { successfulCount: 0, failedCount: 0, neutralCount: 0, totalCount: 0, hasFailures: false };
    }
    const success = results.filter((r) => r && r.success).length;
    const failed = results.filter((r) => r && isFailed(r)).length;
    return {
      successfulCount: success,
      failedCount: failed,
      neutralCount: results.filter((r) => r && isNeutral(r)).length,
      totalCount: results.length,
      hasFailures: failed > 0,
    };
  }, [results]);

  const hasRows = useMemo(
    () => (results ?? []).filter((r) => r?.result_sets && r.result_sets.length > 0).length,
    [results]
  );

  const retryableConnections = useMemo(
    () =>
      (results ?? [])
        .filter((r) => r && (isFailed(r) || r.status === "cancelled"))
        .map((r) => connectionMap.get(String(r.connection_id)))
        .filter((c): c is DatabaseConnection => !!c),
    [results, connectionMap]
  );

  // Automatically expand and select the first failed tenant ONLY when a new run of results arrives
  useEffect(() => {
    if (Array.isArray(results) && results.length > 0) {
      const isNewResults = prevResultsRef.current !== results;
      prevResultsRef.current = results;

      if (isNewResults) {
        if (hasFailures) {
          setIsExpanded(true);
          setStatusFilter("failed");
          const firstFailed = results.find((r) => r && isFailed(r));
          if (firstFailed) {
            setSelectedConnId(String(firstFailed.connection_id));
            return;
          }
        }
        setSelectedConnId((prev) => {
          if (prev && results.some((r) => String(r.connection_id) === prev)) {
            return prev;
          }
          return String(results[0].connection_id);
        });
      }
    }
  }, [results, hasFailures]);

  // Filter results according to tab and search query
  const filteredResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    return results.filter((r) => {
      if (!r || typeof r !== "object") return false;
      if (statusFilter === "failed" && !isFailed(r)) return false;
      if (statusFilter === "success" && !r.success) return false;

      if (!searchQuery.trim()) return true;
      const conn = connectionMap.get(String(r.connection_id));
      const query = searchQuery.toLowerCase();
      const label = String(conn?.displayName || conn?.db || r.connection_id || "");
      const host = String(conn?.host || "");
      const db = String(conn?.db || "");
      const msg = String(r.message || "");
      return (
        label.toLowerCase().includes(query) ||
        host.toLowerCase().includes(query) ||
        db.toLowerCase().includes(query) ||
        msg.toLowerCase().includes(query)
      );
    });
  }, [results, statusFilter, searchQuery, connectionMap]);

  const activeResult = useMemo(() => {
    if (!results || !Array.isArray(results) || !selectedConnId) return null;
    return results.find((r) => r && String(r.connection_id) === String(selectedConnId)) || null;
  }, [results, selectedConnId]);

  const activeConnection = activeResult
    ? connectionMap.get(String(activeResult.connection_id))
    : null;

  // Extract PostgreSQL error code if present, e.g. (Código: 42P01)
  const postgresErrorCode = useMemo(() => {
    if (!activeResult?.message || typeof activeResult.message !== "string") return null;
    const match = activeResult.message.match(/código:\s*([A-Z0-9]+)/i);
    return match ? match[1].toUpperCase() : null;
  }, [activeResult]);

  const handleCopyDiagnostic = () => {
    if (!activeResult) return;
    const diagnostic = [
      `=== DIAGNÓSTICO DE EJECUCIÓN TENANT FORGE ===`,
      `Tenant ID: ${activeResult.connection_id}`,
      `Nombre: ${activeConnection?.displayName || "N/A"}`,
      `Host: ${activeConnection?.host || "localhost"}:${activeConnection?.port || 5432}`,
      `Database: ${activeConnection?.db || "N/A"}`,
      `Schema: ${activeConnection?.schema || "public"}`,
      `Estado: ${activeResult.status ?? (activeResult.success ? "ÉXITO" : "FALLÓ")}`,
      activeResult.duration_ms != null ? `Duración: ${activeResult.duration_ms} ms` : "",
      postgresErrorCode ? `Código Postgres: ${postgresErrorCode}` : "",
      `Mensaje:`,
      activeResult.message,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(diagnostic);
    setHasCopied(true);
    toast.success("Diagnóstico copiado al portapapeles");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleRetryActive = () => {
    if (activeConnection && onRetryConnection) {
      onRetryConnection(activeConnection);
      toast.info(`Reintentando ejecución en ${activeConnection.displayName || activeConnection.id}...`);
    }
  };

  // Solo renderizar la consola si hay resultados o se está ejecutando activamente
  // IMPORTANTE: Esta condición debe ir DESPUÉS de todos los hooks de React
  if ((!results || results.length === 0) && !isExecuting) {
    return null;
  }

  return (
    <div
      className={`border-t border-cerulean-500/20 bg-surface-1/95 backdrop-blur-xl flex flex-col transition-all duration-300 z-30 shrink-0 ${
        isMaximized
          ? "h-96"
          : isExpanded
          ? "h-72"
          : "h-11"
      }`}
    >
      {/* Barra de Control / Header */}
      <div className="flex items-center justify-between px-3.5 h-11 border-b border-surface-border select-none bg-surface-2/40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-cerulean-300 transition-colors cursor-pointer"
          >
            {isExecuting ? (
              <div className="size-3.5 rounded-full border-2 border-cerulean-400 border-t-transparent animate-spin" />
            ) : hasFailures ? (
              <XCircle className="size-4 text-error" />
            ) : (
              <CheckCircle2 className="size-4 text-success" />
            )}
            <span className="font-medium tracking-tight">Consola de Resultados</span>
          </button>

          {/* Badges de Resumen */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-surface-3/60 text-muted-foreground border border-surface-border">
              Total: {totalCount}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-success/10 text-success border border-success/20">
              {successfulCount} exitosos
            </span>
            {failedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-error/15 text-error border border-error/30 animate-pulse">
                <AlertTriangle className="size-3 text-error" />
                {failedCount} fallidos
              </span>
            )}
            {neutralCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-warning/10 text-warning border border-warning/20">
                {neutralCount} revertidos/cancelados
              </span>
            )}
            {isExecuting && phase && phase !== "running" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-cerulean-500/15 text-cerulean-300 border border-cerulean-500/30 animate-pulse">
                {PHASE_LABEL[phase]}…
              </span>
            )}
          </div>
        </div>

        {/* Acciones de la barra */}
        <div className="flex items-center gap-1">
          {onRetryFailed && !isExecuting && retryableConnections.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onRetryFailed(retryableConnections);
                toast.info(`Reintentando ${retryableConnections.length} tenant(s)...`);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-foreground bg-surface-2 hover:bg-surface-3 border border-surface-border hover:border-cerulean-500/40 rounded transition-colors cursor-pointer"
              title="Re-ejecutar solo en los tenants fallidos o cancelados"
            >
              <RotateCcw className="size-3 text-cerulean-400" />
              Reintentar fallidos ({retryableConnections.length})
            </button>
          )}
          {hasRows > 1 && isExpanded && (
            <button
              type="button"
              onClick={() => setCompareMode((v) => !v)}
              className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                compareMode
                  ? "bg-cerulean-500/20 text-cerulean-200 border-cerulean-500/30"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-surface-3/50"
              }`}
              title="Comparar resultados entre tenants"
            >
              Comparar
            </button>
          )}
          {onClear && results && results.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-3/50 rounded transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          )}

          {isExpanded && (
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-surface-3/50 rounded transition-colors cursor-pointer"
              title={isMaximized ? "Restaurar tamaño" : "Maximizar"}
            >
              {isMaximized ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-surface-3/50 rounded transition-colors cursor-pointer"
            title={isExpanded ? "Colapsar consola" : "Expandir consola"}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido Expandido: Panel Dividido (Lista de Tenants + Inspector de Detalle) */}
      {isExpanded && compareMode && hasRows > 1 && (
        <div className="flex-1 min-h-0 overflow-auto p-3">
          <CompareView
            results={results ?? []}
            labelOf={(id) => {
              const c = connectionMap.get(id);
              return c?.displayName || c?.db || id;
            }}
          />
        </div>
      )}

      {isExpanded && !(compareMode && hasRows > 1) && (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Panel Izquierdo: Lista con Filtros */}
          <div className="w-52 sm:w-56 border-r border-surface-border flex flex-col bg-surface-1/50 min-h-0 shrink-0">
            {/* Filtros rápidos y buscador */}
            <div className="p-2 space-y-2 border-b border-surface-border/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por tenant o DB..."
                  className="w-full pl-7 pr-2 py-1 text-[11px] rounded bg-surface-base/80 border border-surface-border focus:border-cerulean-500/50 focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                    statusFilter === "all"
                      ? "bg-cerulean-500/20 text-cerulean-200 border border-cerulean-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("failed")}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                    statusFilter === "failed"
                      ? "bg-error/20 text-error border border-error/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Fallidos ({failedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("success")}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                    statusFilter === "success"
                      ? "bg-success/20 text-success border border-success/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Éxito ({successfulCount})
                </button>
              </div>
            </div>

            {/* Lista de resultados */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border/40">
              {filteredResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No hay conexiones que coincidan con el filtro
                </div>
              ) : (
                filteredResults.map((result) => {
                  const conn = connectionMap.get(String(result.connection_id));
                  const isSelected = String(selectedConnId) === String(result.connection_id);
                  const label = conn?.displayName || conn?.db || result.connection_id;

                  return (
                    <button
                      key={String(result.connection_id)}
                      type="button"
                      onClick={() => setSelectedConnId(String(result.connection_id))}
                      className={`w-full text-left p-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-cerulean-500/10 border-l-2 border-l-cerulean-400"
                          : "hover:bg-surface-2/60"
                      }`}
                    >
                      <span className="mt-0.5">
                        <StatusIcon status={result.status ?? (result.success ? "committed" : "failed")} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {label}
                          </span>
                          {conn?.db && (
                            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-20">
                              {conn.db}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                          {result.duration_ms != null ? `${result.duration_ms} ms · ` : ""}
                          {result.message}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Derecho: Inspector de Diagnóstico y Detalle */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-surface-base/50 overflow-hidden">
            {activeResult ? (
              <div className="flex-1 min-w-0 flex flex-col min-h-0 p-3 overflow-hidden">
                {/* Cabecera del detalle */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-surface-border/70 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="size-6 rounded bg-surface-2 border border-surface-border flex items-center justify-center text-cerulean-400 shrink-0">
                      <Terminal className="size-3" />
                    </div>
                    <span className="text-xs font-semibold text-foreground font-mono truncate max-w-[150px]">
                      {activeConnection?.displayName || activeResult.connection_id}
                    </span>
                    {(() => {
                      const badge =
                        STATUS_BADGE[activeResult.status ?? (activeResult.success ? "committed" : "failed")] ??
                        STATUS_BADGE.failed;
                      return (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border whitespace-nowrap shrink-0 ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                    {activeResult.duration_ms != null && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {activeResult.duration_ms} ms
                      </span>
                    )}
                    {postgresErrorCode && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-error/20 text-error border border-error/30 whitespace-nowrap shrink-0">
                        {postgresErrorCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onRetryConnection && activeConnection && (
                      <button
                        type="button"
                        onClick={handleRetryActive}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-surface-2 hover:bg-surface-3 text-foreground border border-surface-border hover:border-cerulean-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 shadow-xs"
                        title="Reintentar sentencia en esta base de datos"
                      >
                        <RotateCcw className="size-3 text-cerulean-400 shrink-0" />
                        <span>Reintentar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyDiagnostic}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-surface-2 hover:bg-surface-3 text-foreground border border-surface-border hover:border-cerulean-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 shadow-xs"
                      title="Copiar informe técnico al portapapeles"
                    >
                      {hasCopied ? (
                        <Check className="size-3 text-success shrink-0" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground shrink-0" />
                      )}
                      <span>{hasCopied ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                {/* Subcabecera de conexión */}
                <div className="text-[10px] font-mono text-muted-foreground pb-2 shrink-0 truncate">
                  Host: <span className="text-foreground/80">{activeConnection?.host || "localhost"}:{activeConnection?.port || 5432}</span> · DB: <span className="text-foreground/80">{activeConnection?.db || "default"}</span> · Schema: <span className="text-foreground/80">{activeConnection?.schema || "public"}</span>
                </div>

                {/* Consola de Mensaje de Error / Salida */}
                <div className="flex-1 flex flex-col min-h-0 bg-surface-base rounded-lg border border-surface-border/80 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2/40 border-b border-surface-border/60 text-[10px] font-mono text-muted-foreground select-none">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDetailTab("detail")}
                        className={`cursor-pointer ${detailTab === "detail" ? "text-foreground" : "hover:text-foreground"}`}
                      >
                        SALIDA / DETALLE TÉCNICO
                      </button>
                      {(activeResult.result_sets?.length ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setDetailTab("rows")}
                          className={`cursor-pointer ${detailTab === "rows" ? "text-foreground" : "hover:text-foreground"}`}
                        >
                          RESULTADOS ({activeResult.result_sets!.reduce((n, s) => n + s.rows.length, 0)} filas)
                        </button>
                      )}
                    </div>
                    <span>
                      {activeResult.rows_affected != null ? `${activeResult.rows_affected} filas · ` : ""}
                      {(activeResult.status ?? (activeResult.success ? "ok" : "error")).toUpperCase()}
                    </span>
                  </div>

                  {detailTab === "rows" && (activeResult.result_sets?.length ?? 0) > 0 ? (
                    <div className="flex-1 p-2 overflow-auto space-y-2">
                      {activeResult.result_sets!.map((set, i) => (
                        <ResultTable key={i} set={set} />
                      ))}
                    </div>
                  ) : (
                  <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed select-text">
                    {activeResult.success ? (
                      <div className="text-success">
                        <span className="whitespace-pre-wrap">
                          ✓ {activeResult.message || "Sentencia SQL ejecutada correctamente en la base de datos."}
                        </span>
                      </div>
                    ) : isNeutral(activeResult) ? (
                      <div className="text-warning whitespace-pre-wrap break-words">↺ {activeResult.message}</div>
                    ) : (
                      <div className="text-error/90 whitespace-pre-wrap break-all">
                        <span className="text-error font-bold block mb-1">
                          [ERROR EN POSTGRESQL]
                        </span>
                        {activeResult.message}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Selecciona una conexión de la lista para inspeccionar el diagnóstico
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
