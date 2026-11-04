import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import Modal from "@/components/ui-custom/Modal";
import { Button } from "@/components/ui/button";
import { DestructiveFinding } from "./sqlUtils";
import { ExecutionMode, MODE_LABELS } from "@/services/execution.service";

export interface ExecutionReview {
  destructive: DestructiveFinding[];
  tenantCount: number;
  prodTenants: string[];
  mode: ExecutionMode;
  /** Modo todo o nada con muchas conexiones abiertas a la vez */
  manyOpenConnections: boolean;
}

export function needsConfirmation(review: ExecutionReview): boolean {
  return review.destructive.length > 0 || review.prodTenants.length > 0 || review.manyOpenConnections;
}

interface Props {
  review: ExecutionReview | null;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmExecutionDialog({ review, projectName, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(""), [review]);

  if (!review) return null;
  const requiresTyping = review.prodTenants.length > 0 && review.mode !== "dry_run";
  const canConfirm = !requiresTyping || typed.trim() === projectName.trim();

  return (
    <Modal
      open
      onClose={onCancel}
      title="Confirmar ejecución"
      icon={<ShieldAlert className="size-4 text-error" />}
      footer={
        <>
          <Button variant="surface" size="auto" className="px-3 py-1.5 text-xs" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="auto"
            className="px-3 py-1.5 text-xs"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Ejecutar en {review.tenantCount} {review.tenantCount === 1 ? "tenant" : "tenants"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Modo: <span className="text-foreground font-medium">{MODE_LABELS[review.mode].label}</span> —{" "}
          {MODE_LABELS[review.mode].hint}
        </p>

        {review.destructive.length > 0 && (
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-error">
              <AlertTriangle className="size-3.5" />
              Operaciones destructivas en {review.tenantCount} tenants
            </div>
            <ul className="space-y-1 font-mono text-[11px] text-foreground/90">
              {review.destructive.slice(0, 8).map((d, i) => (
                <li key={i} className="truncate">
                  • {d.label}
                </li>
              ))}
              {review.destructive.length > 8 && <li>… y {review.destructive.length - 8} más</li>}
            </ul>
          </div>
        )}

        {review.manyOpenConnections && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground/90">
            El modo <b>Todo o nada</b> mantiene abierta una transacción por tenant hasta decidir.
            Con {review.tenantCount} tenants revisa el <code>max_connections</code> de tus servidores.
          </div>
        )}

        {review.prodTenants.length > 0 && (
          <div className="rounded-lg border border-error/30 bg-surface-2 p-3 space-y-2">
            <p className="text-xs text-foreground">
              Vas a ejecutar sobre <b>{review.prodTenants.length}</b> tenant(s) del grupo{" "}
              <span className="font-mono text-error">prod</span>:{" "}
              <span className="font-mono text-[11px] text-muted-foreground">
                {review.prodTenants.slice(0, 6).join(", ")}
                {review.prodTenants.length > 6 ? "…" : ""}
              </span>
            </p>
            {requiresTyping && (
              <label className="block space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Escribe el nombre del proyecto (<b className="text-foreground">{projectName}</b>) para continuar:
                </span>
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canConfirm) onConfirm();
                  }}
                  className="w-full px-2 py-1 text-xs rounded bg-surface-base border border-surface-border focus:border-error/60 focus:outline-none font-mono"
                />
              </label>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
