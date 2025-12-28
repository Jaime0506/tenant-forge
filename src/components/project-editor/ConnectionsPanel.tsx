import { Database } from "lucide-react";
import { DatabaseConnection } from "./envParser";
import ConnectionChip from "./ConnectionChip";

interface ConnectionsPanelProps {
    connections: DatabaseConnection[];
    selectedConnections: Set<string>;
    onToggleConnection: (connectionId: string) => void;
    onSelectAll: () => void;
    onSelectNone: () => void;
}

export default function ConnectionsPanel({
    connections,
    selectedConnections,
    onToggleConnection,
    onSelectAll,
    onSelectNone,
}: ConnectionsPanelProps) {
    if (connections.length === 0) {
        return null;
    }

    return (
        <div className="p-3 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Database className="size-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                        Conexiones: {selectedConnections.size} de{" "}
                        {connections.length} seleccionadas
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="text-xs text-primary hover:underline px-2 py-1"
                    >
                        Todas
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                        type="button"
                        onClick={onSelectNone}
                        className="text-xs text-primary hover:underline px-2 py-1"
                    >
                        Ninguna
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {connections.map((conn) => (
                    <ConnectionChip
                        key={conn.id}
                        connection={conn}
                        isSelected={selectedConnections.has(conn.id)}
                        onSelect={() => onToggleConnection(conn.id)}
                    />
                ))}
            </div>
        </div>
    );
}
