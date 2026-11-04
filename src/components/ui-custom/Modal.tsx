import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

/** Modal liviano (portal + overlay). Cierra con Escape o clic fuera. */
export default function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  widthClass = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${widthClass} max-h-[85vh] flex flex-col rounded-xl border border-surface-border bg-surface-1 shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground min-w-0">
            {icon}
            <span className="truncate">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-3/50 cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 text-sm">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-surface-border">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
