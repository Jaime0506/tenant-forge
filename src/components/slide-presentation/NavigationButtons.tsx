import { motion } from "motion/react";
import { ArrowLeft, Play, ChevronRight } from "lucide-react";

interface NavigationButtonsProps {
  onPrev: () => void;
  onNext: () => void;
  showPrev: boolean;
  isLastSlide: boolean;
}

export function NavigationButtons({
  onPrev,
  onNext,
  showPrev,
  isLastSlide,
}: NavigationButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full px-4 relative z-20">
      {showPrev && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPrev}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-ink-black-900/40 backdrop-blur-md text-ink-black-50 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl shadow-lg border border-cerulean-800/50 flex items-center justify-center gap-2 hover:bg-ink-black-800 transition-colors will-change-transform pointer-events-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Anterior</span>
        </motion.button>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="group relative w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-ink-black-900 text-white font-black text-sm sm:text-base rounded-lg sm:rounded-xl shadow-2xl transition-all duration-200 overflow-hidden flex items-center justify-center gap-2 will-change-transform pointer-events-auto cursor-pointer border border-cerulean-900/50"
      >
        <motion.div
          className="absolute inset-0 bg-ink-black-950"
          initial={{ x: "-100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.2 }}
        />
        <span className="relative flex items-center gap-2">
          {isLastSlide ? "Comenzar" : "Siguiente"}
          {isLastSlide ? (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </span>
      </motion.button>
    </div>
  );
}

