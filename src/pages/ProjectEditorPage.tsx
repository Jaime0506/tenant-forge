import { useLocation, useParams } from "react-router";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";
import ProjectEditor from "@/components/project-editor/ProjectEditor";
import { motion } from "motion/react";

export default function ProjectEditorPage() {
    const { id } = useParams();
    const { state } = useLocation();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex w-full h-screen bg-ink-black-50 dark:bg-ink-black-950 justify-center items-center overflow-hidden"
        >
            <AnimatedBackground />
            <div className="relative z-10 w-full px-10 h-full flex items-center justify-center">
                <ProjectEditor id={Number(id)} project={state} />
            </div>
        </motion.div>
    );
}
