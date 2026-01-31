import { useState } from "react";
import ProjectsView from "@/components/projects/ProjectsView";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectEditor from "@/components/project-editor/ProjectEditor";
import { ProjectData } from "@/hooks/useProject";
import { X, Home } from "lucide-react";

export default function ProjectsPage() {
  const [openProjects, setOpenProjects] = useState<ProjectData[]>([]);
  const [activeTab, setActiveTab] = useState("home");

  const handleProjectClick = (project: ProjectData) => {
    // Si el proyecto ya está abierto, solo activar su pestaña
    if (!openProjects.find(p => p.id === project.id)) {
      setOpenProjects([...openProjects, project]);
    }
    setActiveTab(project.id?.toString() || "home");
  };

  const handleCloseProject = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newOpenProjects = openProjects.filter(p => p.id !== id);
    setOpenProjects(newOpenProjects);

    // Si cerramos la pestaña activa, volver a inicio o a la anterior
    if (activeTab === id.toString()) {
      setActiveTab("home");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="relative flex w-full h-screen bg-ink-black-50 dark:bg-ink-black-950 justify-center items-center overflow-hidden"
    >
      <AnimatedBackground />

      <div className="relative z-10 w-full h-full p-4 md:p-8 flex flex-col items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between w-full mb-6 px-10">
            <TabsList className="bg-ink-black-900/40 border border-cerulean-500/20 backdrop-blur-md p-1.5 rounded-xl h-auto self-start overflow-hidden">
              <TabsTrigger
                value="home"
                className="gap-2.5 px-6 py-4 data-[state=active]:bg-cerulean-500/20 data-[state=active]:text-white text-ink-black-300 font-bold uppercase tracking-[0.15em] text-[13px] rounded-lg transition-all cursor-pointer"
              >
                <Home className="size-5" />
                Inicio
              </TabsTrigger>

              <AnimatePresence mode="popLayout">
                {openProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsTrigger
                      value={project.id?.toString() || ""}
                      className="group gap-2.5 px-6 py-4 data-[state=active]:bg-cerulean-500/20 data-[state=active]:text-white text-ink-black-300 font-bold uppercase tracking-[0.15em] text-[13px] rounded-lg transition-all relative pr-12 cursor-pointer"
                    >
                      <span className="truncate max-w-[150px]">{project.name}</span>
                      <button
                        onClick={(e) => handleCloseProject(e, project.id!)}
                        className="absolute right-3 p-1.5 rounded-full hover:bg-white/10 text-ink-black-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </TabsTrigger>
                  </motion.div>
                ))}
              </AnimatePresence>
            </TabsList>
          </div>

          <div className="flex-1 w-full px-10 overflow-hidden">
            <TabsContent value="home" className="m-0 h-full w-full data-[state=active]:flex flex-col items-center justify-center data-[state=inactive]:hidden">
              <ProjectsView onProjectClick={handleProjectClick} />
            </TabsContent>

            {openProjects.map((project) => (
              <TabsContent
                key={project.id}
                value={project.id?.toString() || ""}
                forceMount
                className="m-0 h-full w-full data-[state=active]:flex flex-col data-[state=inactive]:hidden"
              >
                <ProjectEditor id={project.id!} project={project} />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </motion.div>
  )
}
