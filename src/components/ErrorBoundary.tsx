import { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex w-full h-screen flex-col items-center justify-center p-6 bg-surface-base text-foreground font-sans">
          <div className="w-full max-w-2xl bg-surface-1 border border-error/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-error pb-3 border-b border-error/20">
              <AlertOctagon className="size-6" />
              <div>
                <h2 className="text-base font-bold">Error en la interfaz (React Crash)</h2>
                <p className="text-xs text-muted-foreground">
                  Se ha capturado una excepción en la renderización
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-error">
                {this.state.error?.name}: {this.state.error?.message}
              </span>

              <div className="p-3 bg-surface-base rounded-lg border border-surface-border text-[11px] font-mono text-error/80 max-h-60 overflow-y-auto whitespace-pre-wrap">
                {this.state.error?.stack || "Sin stack trace disponible"}
              </div>

              {this.state.errorInfo?.componentStack && (
                <div className="p-3 bg-surface-base rounded-lg border border-surface-border text-[10px] font-mono text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                  Component Stack:
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-border">
              <Button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                variant="cta"
                size="auto"
                className="px-4 py-2 text-xs"
              >
                <RotateCcw className="size-3.5" />
                Reiniciar Interfaz
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
