import { ProjectData } from "@/hooks/useProject";
import ProjectCard from "./ProjectCard";
import { useNavigate } from "react-router";

interface ProjectListProps {
    projects: ProjectData[];
}

export default function ProjectList({ projects }: ProjectListProps) {
    const navigate = useNavigate();

    // Con el useLocation podemos acceder a los datos pasados en el navigate
    const handleClick = (id: number, extraData: ProjectData) => {
        navigate(`/project/${id}`, {
            state: {
                ...extraData
            }
        });
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-3">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                    Mis proyectos
                </h2>
                <div className="flex items-center gap-2">
                    <span className="h-1 w-12 bg-cerulean-500 rounded-full" />
                    <p className="text-sm font-bold text-ink-black-300 uppercase tracking-wider">
                        {projects.length === 0
                            ? "Sin proyectos"
                            : `Todos los proyectos`}
                    </p>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex items-center justify-center py-20 bg-ink-black-950/30 rounded-2xl border border-dashed border-cerulean-900/40">
                    <div className="text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-cerulean-500/10 flex items-center justify-center border border-cerulean-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cerulean-400"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m8 17 4 4 4-4" /></svg>
                        </div>
                        <p className="text-ink-black-300 text-lg font-bold">
                            Crea tu primer proyecto para comenzar
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} onClick={(id) => handleClick(id, project)} />
                    ))}
                </div>
            )}
        </div>
    );
}
