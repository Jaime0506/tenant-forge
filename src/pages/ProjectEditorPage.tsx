import { useParams } from "react-router";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";
import ProjectEditor from "@/components/project-editor/ProjectEditor";

export default function ProjectEditorPage() {
    const { id } = useParams();

    return (
        <main className="flex w-full h-screen bg-white dark:bg-slate-900">
            <AnimatedBackground />
            <ProjectEditor id={Number(id)} />
        </main>
    );
}
