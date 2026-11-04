import { useState, useMemo } from "react";
import { Database, CheckSquare, Square, Search } from "lucide-react";
import { DatabaseConnection } from "./envParser";
import ConnectionChip from "./ConnectionChip";
import { MigrationStatus } from "@/services/execution.service";

interface ConnectionsPanelProps {
  connections: DatabaseConnection[];
  selectedConnections: Set<string>;
  onToggleConnection: (connectionId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onRename?: (connectionId: string, displayName: string) => void;
  onSelectGroup?: (group: string) => void;
  migrationStatus?: Map<string, MigrationStatus>;
}

export default function ConnectionsPanel({
  connections,
  selectedConnections,
  onToggleConnection,
  onSelectAll,
  onSelectNone,
  onRename,
  onSelectGroup,
  migrationStatus,
}: ConnectionsPanelProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredConnections = useMemo(() => {
    if (!filterQuery.trim()) return connections;
    const query = filterQuery.toLowerCase();
    return connections.filter(
      (c) =>
        (c.displayName && c.displayName.toLowerCase().includes(query)) ||
        (c.db && c.db.toLowerCase().includes(query)) ||
        c.id.toLowerCase().includes(query) ||
        (c.host && c.host.toLowerCase().includes(query)) ||
        (c.group && c.group.toLowerCase().includes(query))
    );
  }, [connections, filterQuery]);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of connections) {
      if (c.group) counts.set(c.group, (counts.get(c.group) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [connections]);

  if (connections.length === 0) {
    return null;
  }

  const allSelected = connections.length > 0 && selectedConnections.size === connections.length;

  return (
    <div className="p-3 border-b border-surface-border bg-surface-1/60 backdrop-blur-md shrink-0 space-y-2.5">
      {/* Barra de estado y acciones masivas */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Database className="size-3.5 text-cerulean-400" />
          <span className="font-semibold text-foreground tracking-tight">
            Tenants Objetivo
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface-2 text-cerulean-300 border border-surface-border">
            {selectedConnections.size} / {connections.length} seleccionados
          </span>
        </div>

        <div className="flex items-center gap-2">
          {connections.length > 6 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Buscar tenant..."
                className="w-32 pl-6 pr-2 py-0.5 text-[11px] rounded bg-surface-base border border-surface-border focus:border-cerulean-500/50 focus:outline-none text-foreground placeholder:text-muted-foreground font-mono"
              />
            </div>
          )}

          {onSelectGroup && groups.length > 0 && (
            <div className="flex items-center gap-1 border-l border-surface-border/80 pl-2">
              <span className="text-[10px] text-muted-foreground">Grupo:</span>
              {groups.map(([group, count]) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => onSelectGroup(group)}
                  title={`Seleccionar solo los ${count} tenants del grupo ${group}`}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${
                    group.toLowerCase() === "prod"
                      ? "text-error border-error/30 hover:bg-error/10"
                      : "text-cerulean-300 border-surface-border hover:bg-surface-2"
                  }`}
                >
                  {group} ({count})
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 border-l border-surface-border/80 pl-2">
            <button
              type="button"
              onClick={allSelected ? onSelectNone : onSelectAll}
              className="text-[11px] font-medium text-cerulean-300 hover:text-cerulean-200 transition-colors px-1.5 py-0.5 rounded hover:bg-surface-2 cursor-pointer flex items-center gap-1"
            >
              {allSelected ? (
                <>
                  <Square className="size-3" />
                  Desmarcar todos
                </>
              ) : (
                <>
                  <CheckSquare className="size-3" />
                  Seleccionar todos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de chips en cuadrícula fluida */}
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
        {filteredConnections.map((conn) => (
          <ConnectionChip
            key={conn.id}
            connection={conn}
            isSelected={selectedConnections.has(conn.id)}
            onSelect={() => onToggleConnection(conn.id)}
            onRename={onRename}
            migration={migrationStatus?.get(conn.id)}
          />
        ))}
        {filteredConnections.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            Ningún tenant coincide con "{filterQuery}"
          </p>
        )}
      </div>
    </div>
  );
}
