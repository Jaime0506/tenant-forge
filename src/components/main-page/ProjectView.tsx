import { useEffect, useState } from "react";
import CreateProject from "./CreateProject";
import ListProject from "./ListProject";
import { ProjectData } from "@/hooks/useProject";
import { useProjectService } from "@/hooks/useProjectService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProjectView() {
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
        <main className="flex w-full h-full rounded-lg border border-gray-200 dark:border-gray-800 flex-col gap-6 p-6 bg-card">
            <Accordion
                type="single"
                collapsible
                className="w-full"
                value={accordionValue}
                onValueChange={handleAccordionChange}
            >
                <AccordionItem value="create-project" className="border-b last:border-b-0 hover:cursor-pointer">
                    <AccordionTrigger className="px-0 py-4 hover:no-underline cursor-pointer">
                        <div className="flex flex-col gap-2 text-left">
                            <h2 className="text-2xl font-bold text-foreground">Crear proyecto</h2>
                            <p className="text-sm text-muted-foreground font-normal">
                                Completa la información para crear un nuevo proyecto. Solo el nombre es obligatorio.
                            </p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-6">
                        <CreateProject onProjectCreated={refreshProjects} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <section className="flex flex-col gap-6 pt-6 border-t border-border">
                <ListProject projects={projects} />
            </section>
        </main>
    )
}
