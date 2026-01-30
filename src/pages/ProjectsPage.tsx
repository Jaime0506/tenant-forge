
import ProjectsView from "@/components/projects/ProjectsView";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";

export default function ProjectsPage() {
  return (
    <main className="relative flex w-full h-screen bg-ink-black-50 dark:bg-ink-black-950 justify-center items-center overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-7xl h-full p-4 md:p-8 flex items-center justify-center">
        <ProjectsView />
      </div>
    </main>
  )
}
