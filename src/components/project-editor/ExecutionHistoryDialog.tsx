import { useCallback, useEffect, useState } from "react";
import { History, FileInput, CheckCircle2, XCircle, MinusCircle, Undo2, SkipForward } from "lucide-react";
import Modal from "@/components/ui-custom/Modal";
import { Button } from "@/components/ui/button";
import {
  ExecutionDetail,
  ExecutionSummary,
  getExecutionService,
  listExecutionsService,
  MODE_LABELS,
  TenantStatus,
} from "@/services/execution.service";

interface Props {
  open: boolean;
  projectId: number;
  onClose: () => void;
  onLoadSql: (sql: string) => void;
}

export function StatusIcon({ status }: { status?: TenantStatus }) {
  switch (status) {
    case "committed":
      return <CheckCircle2 className="size-3.5 text-success shrink-0" />;
    case "skipped":
      return <SkipForward className="size-3.5 text-cerulean-400 shrink-0" />;
    case "rolled_back":
      return <Undo2 className="size-3.5 text-warning shrink-0" />;
    case "cancelled":
      return <MinusCircle className="size-3.5 text-muted-foreground shrink-0" />;
    default:
      return <XCircle className="size-3.5 text-error shrink-0" />;
  }
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

export default function ExecutionHistoryDialog({ open, projectId, onClose, onLoadSql }: Props) {
  const [items, setItems] = useState<ExecutionSummary[]>([]);
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await listExecutionsService(projectId));
    } catch (e) {
      setError(String(e));
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      setDetail(null);
      load();
    }
  }, [open, load]);

  const select = async (id: string) => {
    try {
      setDetail(await getExecutionService(id));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      widthClass="max-w-4xl"
      title="Historial de ejecuciones"
      icon={<History className="size-4 text-cerulean-400" />}
    >
      {error && <p className="text-xs text-error mb-2">{error}</p>}
      <div className="flex gap-3 min-h-[50vh]">
        <div className="w-72 shrink-0 border border-surface-border rounded-lg overflow-y-auto divide-y divide-surface-border/50">
          {items.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">Todavía no hay ejecuciones en este proyecto.</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id)}
              className={`w-full text-left p-2.5 space-y-1 cursor-pointer transition-colors ${
                detail?.id === item.id ? "bg-cerulean-500/10" : "hover:bg-surface-2/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono text-muted-foreground">{formatDate(item.startedAt)}</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-surface-border text-[10px]">
                  {MODE_LABELS[item.mode]?.label ?? item.mode}
                </span>
              </div>
              <p className="font-mono text-[11px] text-foreground truncate">{item.sql.trim().split("\n")[0]}</p>
              <div className="flex gap-2 text-[10px] font-mono">
                <span className="text-success">{item.ok} ok</span>
                {item.failed > 0 && <span className="text-error">{item.failed} fallidos</span>}
                {item.cancelled > 0 && <span className="text-muted-foreground">{item.cancelled} cancelados</span>}
                <span className="text-muted-foreground">/ {item.total}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {detail ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-muted-foreground truncate" title={detail.scriptHash}>
                  hash {detail.scriptHash.slice(0, 12)}…
                </span>
                <Button
                  variant="surface"
                  size="auto"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => {
                    onLoadSql(detail.sql);
                    onClose();
                  }}
                >
                  <FileInput className="size-3.5 text-cerulean-400" />
                  Cargar SQL en el editor
                </Button>
              </div>
              <pre className="max-h-40 overflow-auto rounded-lg border border-surface-border bg-surface-base p-2 font-mono text-[11px] whitespace-pre-wrap">
                {detail.sql}
              </pre>
              <div className="flex-1 overflow-y-auto rounded-lg border border-surface-border divide-y divide-surface-border/50">
                {detail.results.map((r) => (
                  <div key={r.connectionId} className="flex items-start gap-2 p-2">
                    <StatusIcon status={r.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold font-mono truncate">{r.connectionId}</span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {r.durationMs != null ? `${r.durationMs} ms` : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Selecciona una ejecución para ver el detalle por tenant
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
