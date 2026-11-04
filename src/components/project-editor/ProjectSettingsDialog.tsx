import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import Modal from "@/components/ui-custom/Modal";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_SETTINGS,
  ExecutionMode,
  MODE_LABELS,
  ProjectSettings,
} from "@/services/execution.service";

interface Props {
  open: boolean;
  settings: ProjectSettings;
  onClose: () => void;
  onSave: (settings: ProjectSettings) => Promise<void> | void;
}

const clampInt = (v: string, min: number, max: number, fallback: number) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export default function ProjectSettingsDialog({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ProjectSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  const field = (
    label: string,
    hint: string,
    key: "concurrency" | "statementTimeoutMs" | "lockTimeoutMs" | "maxRows",
    min: number,
    max: number
  ) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft[key]}
        onChange={(e) =>
          setDraft((d) => ({ ...d, [key]: clampInt(e.target.value, min, max, DEFAULT_SETTINGS[key]) }))
        }
        className="w-full px-2 py-1 text-xs rounded bg-surface-base border border-surface-border focus:border-cerulean-500/50 focus:outline-none font-mono"
      />
      <span className="block text-[11px] text-muted-foreground">{hint}</span>
    </label>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configuración de ejecución"
      icon={<Settings2 className="size-4 text-cerulean-400" />}
      footer={
        <>
          <Button variant="surface" size="auto" className="px-3 py-1.5 text-xs" onClick={() => setDraft(DEFAULT_SETTINGS)}>
            Restablecer
          </Button>
          <Button
            variant="cta"
            size="auto"
            className="px-3 py-1.5 text-xs"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(draft);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-xs font-medium text-foreground">Modo por defecto</span>
          <select
            value={draft.defaultMode}
            onChange={(e) => setDraft((d) => ({ ...d, defaultMode: e.target.value as ExecutionMode }))}
            className="w-full px-2 py-1 text-xs rounded bg-surface-base border border-surface-border focus:outline-none"
          >
            {(Object.keys(MODE_LABELS) as ExecutionMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m].label}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-muted-foreground">{MODE_LABELS[draft.defaultMode].hint}</span>
        </label>
        {field("Concurrencia", "Tenants ejecutándose a la vez (1–50).", "concurrency", 1, 50)}
        {field("Filas máximas por tenant", "Límite de filas devueltas por SELECT.", "maxRows", 1, 10000)}
        {field(
          "statement_timeout (ms)",
          "Cancela sentencias más largas. 0 = sin límite.",
          "statementTimeoutMs",
          0,
          86_400_000
        )}
        {field(
          "lock_timeout (ms)",
          "Falla si espera un lock más que esto. 0 = sin límite.",
          "lockTimeoutMs",
          0,
          86_400_000
        )}
      </div>
    </Modal>
  );
}
