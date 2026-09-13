import { useState } from "react";
import ProjectsView from "@/components/projects/ProjectsView";
import { AnimatePresence, motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectEditor from "@/components/project-editor/ProjectEditor";
import { ProjectData } from "@/hooks/useProject";
import { X, Home, Database } from "lucide-react";
import ThemeToggle from "@/components/ui-custom/ThemeToggle";

export default function ProjectsPage() {
  const [openProjects, setOpenProjects] = useState<ProjectData[]>([]);
  const [activeTab, setActiveTab] = useState("home");

  const handleProjectClick = (project: ProjectData) => {
    if (!openProjects.find((p) => p.id === project.id)) {
      setOpenProjects([...openProjects, project]);
    }
    setActiveTab(project.id?.toString() || "home");
  };

  const handleCloseProject = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newOpenProjects = openProjects.filter((p) => p.id !== id);
    setOpenProjects(newOpenProjects);

    if (activeTab === id.toString()) {
      setActiveTab("home");
    }
  };

  return (
    <div className="relative flex w-full h-screen bg-surface-base text-foreground justify-center items-center overflow-hidden">
      <div className="absolute inset-0 bg-ambient-glow pointer-events-none select-none" />
      <div className="absolute inset-0 bg-grain opacity-[0.05] mix-blend-overlay pointer-events-none select-none" />

      <div className="relative z-10 w-full h-full p-2.5 sm:p-4 md:p-5 flex flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col h-full overflow-hidden"
        >
          {/* Desktop Top Bar: Navigation & Tabs */}
          <div className="flex items-center justify-between w-full mb-3 shrink-0 px-1">
            <TabsList className="bg-surface-1/90 border border-surface-border backdrop-blur-md p-1 rounded-lg self-start inline-flex items-center gap-1.5 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Pestaña Inicio */}
              <TabsTrigger
                value="home"
                className="gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer inline-flex items-center"
              >
                <Home className="size-3.5 shrink-0" />
                <span className="leading-none">Inicio</span>
              </TabsTrigger>

              {/* Pestañas de Proyectos Abiertos */}
              <AnimatePresence mode="popLayout">
                {openProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95, x: -6 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 6 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center"
                  >
                    <TabsTrigger
                      value={project.id?.toString() || ""}
                      className="group gap-2 pl-3 pr-2 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer inline-flex items-center"
                    >
                      <Database className="size-3.5 text-cerulean-400 shrink-0" />
                      <span className="truncate max-w-[140px] font-mono leading-none">
                        {project.name}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleCloseProject(e, project.id!)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCloseProject(e as any, project.id!);
                          }
                        }}
                        className="ml-1 p-0.5 rounded hover:bg-surface-base hover:text-error text-muted-foreground transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                        title="Cerrar pestaña"
                        aria-label="Cerrar pestaña"
                      >
                        <X className="size-3" />
                      </span>
                    </TabsTrigger>
                  </motion.div>
                ))}
              </AnimatePresence>
            </TabsList>

            <ThemeToggle />
          </div>

          {/* Área de Contenido */}
          <div className="flex-1 w-full overflow-hidden min-h-0">
            <TabsContent
              value="home"
              className="m-0 h-full w-full data-[state=active]:flex flex-col items-center justify-center data-[state=inactive]:hidden overflow-hidden"
            >
              <ProjectsView onProjectClick={handleProjectClick} />
            </TabsContent>

            {openProjects.map((project) => (
              <TabsContent
                key={project.id}
                value={project.id?.toString() || ""}
                forceMount
                className="m-0 h-full w-full data-[state=active]:flex flex-col data-[state=inactive]:hidden overflow-hidden"
              >
                <ProjectEditor id={project.id!} project={project} />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
