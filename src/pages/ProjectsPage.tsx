import ProjectsView from "@/components/projects/ProjectsView";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";
import { motion } from "motion/react";

export default function ProjectsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="relative flex w-full h-screen bg-ink-black-50 dark:bg-ink-black-950 justify-center items-center overflow-hidden"
    >
      <AnimatedBackground />
      <div className="relative z-10 w-full h-full px-10 flex items-center justify-center">
        <ProjectsView />
      </div>
    </motion.div>
  )
}
