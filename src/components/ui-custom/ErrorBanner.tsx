import { XCircle, AlertTriangle, Info, X } from "lucide-react";
import { ReactNode } from "react";

interface ErrorBannerProps {
  title?: string;
  message?: string | ReactNode;
  variant?: "error" | "warning" | "info";
  code?: string | number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function ErrorBanner({
  title,
  message,
  variant = "error",
  code,
  onDismiss,
  action,
  className = "",
}: ErrorBannerProps) {
  const styles = {
    error: {
      border: "border-error/30",
      bg: "bg-error-soft",
      text: "text-foreground",
      titleText: "text-error",
      icon: <XCircle className="size-4.5 text-error shrink-0 mt-0.5" />,
      badge: "bg-error/15 text-error border-error/30",
    },
    warning: {
      border: "border-warning/30",
      bg: "bg-warning-soft",
      text: "text-foreground",
      titleText: "text-warning",
      icon: <AlertTriangle className="size-4.5 text-warning shrink-0 mt-0.5" />,
      badge: "bg-warning/15 text-warning border-warning/30",
    },
    info: {
      border: "border-info/30",
      bg: "bg-info-soft",
      text: "text-foreground",
      titleText: "text-info",
      icon: <Info className="size-4.5 text-info shrink-0 mt-0.5" />,
      badge: "bg-info/15 text-info border-info/30",
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-3.5 rounded-lg border backdrop-blur-md transition-all ${styles.bg} ${styles.border} ${className}`}
    >
      {styles.icon}
      
      <div className="flex-1 min-w-0 space-y-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {title && (
            <span className={`font-semibold tracking-wide ${styles.titleText}`}>
              {title}
            </span>
          )}
          {code && (
            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium border ${styles.badge}`}>
              Código: {code}
            </span>
          )}
        </div>

        {message && (
          <div className={`font-mono text-[11px] leading-relaxed wrap-break-word opacity-95 ${styles.text}`}>
            {message}
          </div>
        )}

        {action && (
          <div className="pt-1.5">
            <button
              type="button"
              onClick={action.onClick}
              className="text-[11px] font-medium underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer text-primary"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Cerrar alerta"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
