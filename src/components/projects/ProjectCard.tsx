import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectData } from "@/hooks/useProject";

interface ProjectCardProps {
    project: ProjectData;
    onClick: (id: number) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
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
            className="group relative flex flex-col gap-4 p-5 rounded-xl border border-cerulean-500/20 bg-ink-black-950/60 backdrop-blur-md hover:border-cerulean-400/50 hover:shadow-[0_0_30px_rgba(8,191,247,0.15)] transition-all duration-300 cursor-pointer overflow-hidden shadow-lg"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(project.id ?? 0)}
        >
            {/* Borde superior animado que crece desde el centro */}
            <AnimatePresence>
                {isLongHover && (
                    <motion.div
                        className="absolute top-0 left-1/2 h-0.5 bg-linear-to-r from-cerulean-400 to-icy-aqua-400 rounded-t-lg z-20"
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
            <div className="flex items-start justify-between gap-3 relative z-10">
                <h3 className="text-xl font-black text-white line-clamp-2 flex-1 tracking-tight group-hover:text-cerulean-300 transition-colors">
                    {project.name}
                </h3>
                {project.id && (
                    <span className="text-[10px] text-cerulean-300 font-black tracking-widest uppercase bg-cerulean-400/10 px-2 py-0.5 rounded shrink-0 border border-cerulean-400/20 shadow-inner">
                        ID: {project.id}
                    </span>
                )}
            </div>

            {/* Descripción */}
            {project.description && (
                <p className="text-sm text-ink-black-200 line-clamp-3 relative z-10 font-medium leading-relaxed">
                    {project.description}
                </p>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto relative z-10 pt-2">
                    {project.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-ink-black-950/80 text-cerulean-300 border border-cerulean-800/30 uppercase tracking-wider"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Subtle glow on hover */}
            <div className="absolute inset-0 bg-linear-to-br from-cerulean-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    );
}

