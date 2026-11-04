import { useMemo } from "react";
import { ExecutionResult, ResultSet } from "@/services/execution.service";

const MAX_RENDER_ROWS = 200;

export function ResultTable({ set }: { set: ResultSet }) {
  const rows = set.rows.slice(0, MAX_RENDER_ROWS);
  return (
    <div className="overflow-auto rounded border border-surface-border">
      <table className="min-w-full text-[11px] font-mono">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {set.columns.map((c, i) => (
              <th key={i} className="px-2 py-1 text-left font-semibold text-foreground border-b border-surface-border whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="odd:bg-surface-base even:bg-surface-1/60">
              {row.map((cell, c) => (
                <td key={c} className="px-2 py-0.5 whitespace-nowrap text-foreground/90">
                  {cell === null ? <span className="text-muted-foreground italic">NULL</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {(set.truncated || set.rows.length > MAX_RENDER_ROWS) && (
        <p className="px-2 py-1 text-[10px] text-warning border-t border-surface-border">
          Resultado truncado ({set.rows.length} filas mostradas
          {set.truncated ? "; el servidor devolvió más, sube el límite en la configuración" : ""})
        </p>
      )}
    </div>
  );
}

/** Valor más frecuente de una lista (para resaltar los tenants que difieren). */
function mode<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>();
  let best: T | undefined;
  let bestCount = 0;
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (n > bestCount) {
      best = v;
      bestCount = n;
    }
  }
  return best;
}

interface CompareProps {
  results: ExecutionResult[];
  labelOf: (connectionId: string) => string;
}

/**
 * Compara el primer result set de cada tenant. Si cada tenant devolvió una
 * sola fila con las mismas columnas (p. ej. un count), muestra una matriz
 * tenant × columna; si no, compara cantidad de filas y contenido.
 */
export function CompareView({ results, labelOf }: CompareProps) {
  const entries = useMemo(
    () =>
      results
        .filter((r) => r.result_sets && r.result_sets.length > 0)
        .map((r) => ({ id: String(r.connection_id), set: r.result_sets![0] })),
    [results]
  );

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground p-3">Ningún tenant devolvió filas.</p>;
  }

  const columnsKey = (s: ResultSet) => s.columns.join("\u0001");
  const sameColumns = entries.every((e) => columnsKey(e.set) === columnsKey(entries[0].set));
  const singleRow = sameColumns && entries.every((e) => e.set.rows.length <= 1);

  if (singleRow) {
    const columns = entries[0].set.columns;
    const commonPerColumn = columns.map((_, c) => mode(entries.map((e) => e.set.rows[0]?.[c] ?? null)));
    return (
      <div className="overflow-auto rounded border border-surface-border">
        <table className="min-w-full text-[11px] font-mono">
          <thead className="sticky top-0 bg-surface-2">
            <tr>
              <th className="px-2 py-1 text-left border-b border-surface-border">Tenant</th>
              {columns.map((c, i) => (
                <th key={i} className="px-2 py-1 text-left border-b border-surface-border whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="odd:bg-surface-base even:bg-surface-1/60">
                <td className="px-2 py-0.5 font-semibold whitespace-nowrap">{labelOf(e.id)}</td>
                {columns.map((_, c) => {
                  const value = e.set.rows[0]?.[c] ?? null;
                  const differs = entries.length > 1 && value !== commonPerColumn[c];
                  return (
                    <td
                      key={c}
                      className={`px-2 py-0.5 whitespace-nowrap ${differs ? "bg-warning/15 text-warning font-semibold" : ""}`}
                    >
                      {value === null ? <span className="italic text-muted-foreground">NULL</span> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const signatures = entries.map((e) => JSON.stringify([e.set.columns, e.set.rows]));
  const common = mode(signatures);
  return (
    <div className="overflow-auto rounded border border-surface-border">
      <table className="min-w-full text-[11px] font-mono">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            <th className="px-2 py-1 text-left border-b border-surface-border">Tenant</th>
            <th className="px-2 py-1 text-left border-b border-surface-border">Columnas</th>
            <th className="px-2 py-1 text-right border-b border-surface-border">Filas</th>
            <th className="px-2 py-1 text-left border-b border-surface-border">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const same = signatures[i] === common;
            return (
              <tr key={e.id} className="odd:bg-surface-base even:bg-surface-1/60">
                <td className="px-2 py-0.5 font-semibold whitespace-nowrap">{labelOf(e.id)}</td>
                <td className="px-2 py-0.5 text-muted-foreground truncate max-w-60">{e.set.columns.join(", ")}</td>
                <td className="px-2 py-0.5 text-right">{e.set.rows.length}{e.set.truncated ? "+" : ""}</td>
                <td className={`px-2 py-0.5 ${same ? "text-success" : "text-warning font-semibold"}`}>
                  {same ? "igual a la mayoría" : "difiere"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
