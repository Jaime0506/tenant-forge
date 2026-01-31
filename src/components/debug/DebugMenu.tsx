import { useState } from "react";
import { useNavigate } from "react-router";
import { Bug, X, Home, Layout, FileEdit, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const ROUTES = [
    { name: "Presentación", path: "/", icon: Home },
    { name: "Main / Projects", path: "/main", icon: Layout },
    { name: "Project Editor", path: "/project/debug-mode", icon: FileEdit },
];

export default function DebugMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // Solo renderizar en desarrollo
    if (!import.meta.env.DEV) return null;

    return (
        <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-ink-black-900/80 backdrop-blur-xl border border-cerulean-800/30 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] p-2 min-w-[200px] overflow-hidden"
                    >
                        <div className="px-3 py-2 border-b border-cerulean-900/50 mb-1">
                            <p className="text-[10px] font-black text-cerulean-500 uppercase tracking-[0.2em]">
                                Debug System
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            {ROUTES.map((route) => (
                                <button
                                    key={route.path}
                                    onClick={() => {
                                        navigate(route.path);
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-cerulean-900/30 text-ink-black-100 transition-all group text-sm font-medium"
                                >
                                    <div className="flex items-center gap-3">
                                        <route.icon size={16} className="text-cerulean-400 group-hover:text-icy-aqua-400 transition-colors" />
                                        <span>{route.name}</span>
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-cerulean-400" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border border-cerulean-800/30 hover:cursor-pointer",
                    isOpen
                        ? "bg-cerulean-600 text-white shadow-cerulean-900/50"
                        : "bg-cerulean-900 text-cerulean-200 shadow-black/50"
                )}
            >
                {isOpen ? <X size={24} /> : <Bug size={24} />}
            </motion.button>
        </div>
    );
}
