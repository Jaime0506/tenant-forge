
import ProjectsView from "@/components/projects/ProjectsView";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";

export default function ProjectsPage() {
  return (
    <main className="flex w-full h-screen bg-white dark:bg-slate-900 justify-center items-center">
      <AnimatedBackground />
      <ProjectsView />
    </main>
  )
}
