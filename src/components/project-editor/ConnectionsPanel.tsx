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
        <div className="p-3 border-b border-cerulean-500/10 bg-ink-black-950/40 backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Database className="size-3 text-cerulean-400" />
                    <span className="text-xs font-black text-cerulean-100 uppercase tracking-[0.2em]">
                        Conexiones: {selectedConnections.size} de{" "}
                        {connections.length} seleccionadas
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="text-xs font-black text-cerulean-300 hover:text-white uppercase tracking-widest px-2 py-1 transition-colors cursor-pointer"
                    >
                        Todas
                    </button>
                    <span className="text-cerulean-900/50">|</span>
                    <button
                        type="button"
                        onClick={onSelectNone}
                        className="text-xs font-black text-cerulean-300 hover:text-white uppercase tracking-widest px-2 py-1 transition-colors cursor-pointer"
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
