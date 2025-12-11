import { ProjectData } from "@/hooks/useProject";
import ProjectCard from "./ProjectCard";
import { useNavigate } from "react-router";

interface ProjectListProps {
    projects: ProjectData[];
}

export default function ProjectList({ projects }: ProjectListProps) {
    const navigate = useNavigate();

    const handleClick = (id: number) => {
        navigate(`/project/${id}`);
    };

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
                        <ProjectCard key={project.id} project={project} onClick={handleClick} />
                    ))}
                </div>
            )}
        </div>
    );
}
