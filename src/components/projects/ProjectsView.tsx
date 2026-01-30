import { useEffect, useState } from "react";
import ProjectCreateForm from "./ProjectCreateForm";
import ProjectList from "./ProjectList";
import { ProjectData } from "@/hooks/useProject";
import { useProjectService } from "@/hooks/useProjectService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProjectsView() {
    const { getProjects } = useProjectService();
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [accordionValue, setAccordionValue] = useState<string>("");

    useEffect(() => {
        getProjects((projects: ProjectData[]) => {
            // Si no hay proyectos, abrir el accordion automáticamente
            if (projects.length === 0) {
                setAccordionValue("create-project");
            } else {
                setAccordionValue("");
            }

            setProjects(projects);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAccordionChange = (value: string) => {
        setAccordionValue(value);
    };

    const refreshProjects = () => {
        getProjects((projects: ProjectData[]) => {
            // Si no hay proyectos, abrir el accordion automáticamente
            if (projects.length === 0) {
                setAccordionValue("create-project");
            } else {
                setAccordionValue("");
            }
            setProjects(projects);
        });
    };

    return (
        <main className="flex w-full h-full max-h-[90vh] rounded-2xl border border-cerulean-500/30 flex-col gap-6 p-6 sm:p-8 bg-ink-black-950/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar">
            <Accordion
                type="single"
                collapsible
                className="w-full"
                value={accordionValue}
                onValueChange={handleAccordionChange}
            >
                <AccordionItem value="create-project" className="border-b border-cerulean-500/10 last:border-b-0">
                    <AccordionTrigger className="px-0 py-4 hover:no-underline cursor-pointer group">
                        <div className="flex flex-col gap-2 text-left">
                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter group-hover:text-cerulean-400 transition-colors">
                                Crear proyecto
                            </h2>
                            <p className="text-sm sm:text-base text-ink-black-200 font-semibold tracking-wide">
                                Completa la información para crear un nuevo proyecto. Solo el nombre es obligatorio.
                            </p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-6">
                        <div className="bg-ink-black-950/50 rounded-xl p-6 border border-cerulean-900/50 mt-2">
                            <ProjectCreateForm onProjectCreated={refreshProjects} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <section className="flex flex-col gap-8 pt-8 border-t border-cerulean-800/20">
                <ProjectList projects={projects} />
            </section>
        </main>
    )
}
