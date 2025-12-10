import { useParams } from "react-router";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";
import ProjectSelected from "@/components/project-page/ProjectSelected";

export default function ProjectPage() {
    const { id } = useParams();

    return (
        <main className="flex w-full h-screen bg-white dark:bg-slate-900 justify-center items-center">
            <AnimatedBackground />
            <ProjectSelected id={Number(id)} />
        </main>
    );
}
