import { useState, useRef, useEffect } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Check, Pencil, Server } from "lucide-react";
import { DatabaseConnection } from "./envParser";

function connectionLabel(conn: DatabaseConnection): string {
  return conn.displayName || conn.db || conn.id || "Conexión";
}

interface ConnectionChipProps {
  connection: DatabaseConnection;
  isSelected: boolean;
  onSelect: () => void;
  onRename?: (connectionId: string, displayName: string) => void;
}

export default function ConnectionChip({
  connection,
  isSelected,
  onSelect,
  onRename,
}: ConnectionChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(connectionLabel(connection));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(connectionLabel(connection));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, connection.displayName, connection.db, connection.id]);

  const handleCommitRename = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== connectionLabel(connection) && onRename) {
      onRename(connection.id, trimmed);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`group/chip relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-150 border select-none ${
            isSelected
              ? "bg-cerulean-500/10 text-cerulean-200 border-cerulean-500/35 shadow-[0_0_12px_rgba(var(--brand-rgb),0.08)]"
              : "bg-surface-2/60 text-muted-foreground border-surface-border hover:bg-surface-3/50 hover:text-foreground"
          }`}
        >
          {/* Botón de selección principal */}
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1.5 min-w-0 cursor-pointer text-left"
          >
            <div
              className={`size-3.5 rounded flex items-center justify-center border transition-colors ${
                isSelected
                  ? "bg-cerulean-500 border-cerulean-400 text-surface-base"
                  : "border-muted-foreground/40 bg-surface-base/50"
              }`}
            >
              {isSelected && <Check className="size-2.5 stroke-3" />}
            </div>

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommitRename();
                  if (e.key === "Escape") {
                    setEditValue(connectionLabel(connection));
                    setIsEditing(false);
                    inputRef.current?.blur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-24 bg-surface-base px-1.5 py-0.5 rounded border border-cerulean-500 text-foreground text-xs font-mono outline-none"
              />
            ) : (
              <span className="font-mono text-[11px] font-medium max-w-[130px] truncate leading-none">
                {connectionLabel(connection)}
              </span>
            )}
          </button>

          {/* Botón para renombrar al pasar el cursor */}
          {onRename && !isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="opacity-0 group-hover/chip:opacity-100 p-0.5 rounded hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
              title="Renombrar conexión"
              aria-label="Renombrar conexión"
            >
              <Pencil className="size-2.5" />
            </button>
          )}
        </div>
      </TooltipTrigger>

      <TooltipContent side="bottom" className="p-3 bg-surface-1/95 border border-cerulean-500/20 backdrop-blur-md shadow-2xl text-xs rounded-lg max-w-xs">
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 font-sans font-semibold text-foreground border-b border-surface-border pb-1 mb-1">
            <Server className="size-3 text-cerulean-400" />
            <span>{connection.displayName || connection.id}</span>
          </div>
          {connection.db && (
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>Database:</span>
              <span className="text-foreground font-medium">{connection.db}</span>
            </div>
          )}
          {connection.schema && (
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>Schema:</span>
              <span className="text-foreground">{connection.schema}</span>
            </div>
          )}
          {connection.host && (
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>Host:</span>
              <span className="text-foreground">{connection.host}:{connection.port || 5432}</span>
            </div>
          )}
          {connection.user && (
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>User:</span>
              <span className="text-foreground">{connection.user}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
