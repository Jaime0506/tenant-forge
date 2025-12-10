import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectData } from "@/hooks/useProject";

interface ProjectItemProps {
    project: ProjectData;
    onClick: (id: number) => void;
}

export default function ProjectItem({ project, onClick }: ProjectItemProps) {
    const [isLongHover, setIsLongHover] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        hoverTimerRef.current = setTimeout(() => {
            setIsLongHover(true);
        }, 100);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setIsLongHover(false);
    };

    return (
        <div
            className="group relative flex flex-col gap-3 p-4 rounded-lg border border-border bg-background hover:border-ring hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(project.id ?? 0)}
        >
            {/* Borde superior animado que crece desde el centro */}
            <AnimatePresence>
                {isLongHover && (
                    <motion.div
                        className="absolute top-0 left-1/2 h-0.5 bg-linear-to-r from-green-500 to-emerald-500 rounded-t-lg"
                        initial={{ width: "0%", x: "-50%" }}
                        animate={{ width: "100%", x: "-50%" }}
                        exit={{ width: "0%", x: "-50%" }}
                        transition={{
                            duration: 0.2,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header del proyecto */}
            <div className="flex items-start justify-between gap-2 relative z-10">
                <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
                    {project.name}
                </h3>
                {project.id && (
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                        #{project.id}
                    </span>
                )}
            </div>

            {/* Descripción */}
            {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 relative z-10">
                    {project.description}
                </p>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                    {project.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </div>
    );
}

