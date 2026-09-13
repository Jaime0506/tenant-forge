import { useMemo } from "react";
import { Database, ArrowRight, Layers } from "lucide-react";
import { ProjectData } from "@/hooks/useProject";

interface ProjectCardProps {
  project: ProjectData;
  onClick: (id: number) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  // Compute how many connections this project has
  const connectionCount = useMemo(() => {
    if (!project.connections) return 0;
    try {
      if (typeof project.connections === "string") {
        if (project.connections.trim().startsWith("[")) {
          const parsed = JSON.parse(project.connections);
          return Array.isArray(parsed) ? parsed.length : 0;
        }
        // Count POSTGRES_DB occurrences or similar
        const dbMatches = project.connections.match(/POSTGRES_DB/gi);
        return dbMatches ? dbMatches.length : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }, [project.connections]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(project.id ?? 0)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(project.id ?? 0);
        }
      }}
      className="group relative flex flex-col justify-between p-5 rounded-xl border border-surface-border bg-surface-1/80 hover:bg-surface-2/60 hover:border-cerulean-500/35 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(var(--brand-rgb),0.08)] select-none text-left"
    >
      {/* Indicador de acento superior tenue */}
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-cerulean-500/20 to-transparent group-hover:via-cerulean-400/50 transition-colors" />

      <div>
        {/* Cabecera del Proyecto */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-lg bg-surface-2 border border-surface-border group-hover:border-cerulean-500/40 group-hover:bg-cerulean-500/10 flex items-center justify-center text-cerulean-400 transition-colors shrink-0">
              <Database className="size-4.5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-cerulean-300 transition-colors truncate tracking-tight">
                {project.name}
              </h3>
              {project.id && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  ID #{project.id}
                </span>
              )}
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cerulean-400 shrink-0">
            <ArrowRight className="size-4" />
          </div>
        </div>

        {/* Descripción */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 min-h-10">
          {project.description || "Sin descripción configurada para este proyecto."}
        </p>
      </div>

      {/* Footer / Metadatos */}
      <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Layers className="size-3 text-cerulean-400" />
          <span>
            {connectionCount > 0
              ? `${connectionCount} ${connectionCount === 1 ? "tenant" : "tenants"}`
              : "Sin tenants"}
          </span>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden">
            {project.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-cerulean-300 border border-surface-border truncate max-w-20"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                +{project.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
