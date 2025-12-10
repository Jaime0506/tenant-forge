import { ProjectData } from "@/hooks/useProject";

interface ListProjectProps {
    projects: ProjectData[];
}

export default function ListProject({ projects }: ListProjectProps) {
    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-foreground">Mis proyectos</h1>
                <p className="text-sm text-muted-foreground">
                    {projects.length === 0
                        ? "No tienes proyectos creados aún"
                        : `${projects.length} ${projects.length === 1 ? 'proyecto' : 'proyectos'} en total`}
                </p>
            </div>

            {projects.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-muted-foreground text-lg">
                            Crea tu primer proyecto para comenzar
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="group relative flex flex-col gap-3 p-4 rounded-lg border border-border bg-background hover:border-ring hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                            {/* Header del proyecto */}
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
                                    {project.name}
                                </h3>
                                {project.id && (
                                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                                        #{project.id}
                                    </span>
                                )}
                            </div>

                            {/* Descripción */}
                            {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {project.description}
                                </p>
                            )}

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {project.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
