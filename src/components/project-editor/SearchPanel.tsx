import { useState, useEffect, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import {
    setCinematicSearch,
    clearCinematicSearch,
    gotoNextMatch,
    gotoPrevMatch,
    cinematicSearchField
} from "./cinematicSearchExtension";
import {
    X,
    ChevronDown,
    ChevronUp,
    Type,
    WholeWord,
    Search as SearchIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchPanelProps {
    view: EditorView;
    onClose: () => void;
    isVisible: boolean;
}

export default function SearchPanel({ view, onClose, isVisible }: SearchPanelProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [matchCase, setMatchCase] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [matchesCount, setMatchesCount] = useState({ current: 0, total: 0 });

    const updateSearch = useCallback((term: string, caseSensitive: boolean, word: boolean) => {
        if (!view) return;
        view.dispatch({
            effects: setCinematicSearch.of({ search: term, caseSensitive, wholeWord: word })
        });
    }, [view]);

    useEffect(() => {
        if (isVisible) {
            const input = document.getElementById("cm-search-input");
            input?.focus();

            // Sincronizar recuento inicial y re-aplicar búsqueda si hay término
            if (searchTerm) {
                updateSearch(searchTerm, matchCase, wholeWord);
            }

            try {
                const state = view.state.field(cinematicSearchField);
                setMatchesCount({
                    current: state.activeIndex + 1,
                    total: state.matches.length
                });
            } catch (e) {
                console.error("Search field not ready", e);
            }
        } else {
            view.dispatch({ effects: clearCinematicSearch.of() });
            setMatchesCount({ current: 0, total: 0 });
        }
    }, [isVisible, view, searchTerm, matchCase, wholeWord, updateSearch]);

    // Actualizar recuentos cuando cambia el estado del editor (vía listener real, no polling)
    useEffect(() => {
        if (!view || !isVisible) return;

        const updateCount = () => {
            try {
                const state = view.state.field(cinematicSearchField);
                if (state) {
                    setMatchesCount({
                        current: state.activeIndex + 1,
                        total: state.matches.length
                    });
                }
            } catch (e) {
                // No inicializado
            }
        };

        // Ejecutar inicialmente
        updateCount();

        // En lugar de polling, CM6 permite escuchar cambios de forma nativa
        // Pero como ya tenemos el editor creado, podemos usar el sistema de efectos o un intervalo muy bajo
        // Sin embargo, para no complicar el dispatch, mantendremos un intervalo de 30ms para fluidez total
        const interval = setInterval(updateCount, 30);
        return () => clearInterval(interval);
    }, [view, isVisible]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        updateSearch(value, matchCase, wholeWord);
    };

    const handleNext = () => {
        gotoNextMatch(view);
    };

    const handlePrev = () => {
        gotoPrevMatch(view);
    };

    const toggleCase = () => {
        const newVal = !matchCase;
        setMatchCase(newVal);
        updateSearch(searchTerm, newVal, wholeWord);
    };

    const toggleWholeWord = () => {
        const newVal = !wholeWord;
        setWholeWord(newVal);
        updateSearch(searchTerm, matchCase, newVal);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
                handlePrev();
            } else {
                handleNext();
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -10, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -10, x: 20 }}
                    className="absolute top-4 right-4 z-50 flex items-center gap-1 p-1 bg-ink-black-900/95 backdrop-blur-xl border border-cerulean-900/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[300px]"
                >
                    <div className="flex items-center gap-2 flex-1 px-2">
                        <SearchIcon className="size-3.5 text-ink-black-400" />
                        <div className="relative flex-1 group">
                            <input
                                id="cm-search-input"
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar..."
                                autoFocus
                                className="w-full bg-transparent text-white text-sm py-1.5 px-1 outline-none placeholder:text-ink-black-500 pr-20"
                            />

                            {/* Resultados y Opciones */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {searchTerm && (
                                    <span className="text-[10px] font-bold text-ink-black-400 mr-1 tabular-nums animate-in fade-in zoom-in duration-200">
                                        {matchesCount.total > 0 ? matchesCount.current : 0}/{matchesCount.total}
                                    </span>
                                )}
                                <button
                                    onClick={toggleCase}
                                    title="Coincidir mayúsculas"
                                    className={`p-1 rounded transition-colors ${matchCase ? 'bg-cerulean-500/20 text-cerulean-400' : 'text-ink-black-500 hover:text-ink-black-300'}`}
                                >
                                    <Type className="size-3.5" />
                                </button>
                                <button
                                    onClick={toggleWholeWord}
                                    title="Palabra completa"
                                    className={`p-1 rounded transition-colors ${wholeWord ? 'bg-cerulean-500/20 text-cerulean-400' : 'text-ink-black-500 hover:text-ink-black-300'}`}
                                >
                                    <WholeWord className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 border-l border-ink-black-800 ml-1 pl-1 pr-1">
                        <button
                            onClick={handlePrev}
                            className="p-1.5 text-ink-black-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Anterior (Shift+Enter)"
                        >
                            <ChevronUp className="size-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-1.5 text-ink-black-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Siguiente (Enter)"
                        >
                            <ChevronDown className="size-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-ink-black-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-1"
                            title="Cerrar (Esc)"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
