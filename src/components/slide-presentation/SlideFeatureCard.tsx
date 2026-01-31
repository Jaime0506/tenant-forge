import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface SlideFeatureCardProps {
  icon: LucideIcon;
  text: string;
  index: number;
}

export function SlideFeatureCard({ icon: Icon, text, index }: SlideFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.05, duration: 0.2 }}
      className="bg-ink-black-900/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-xl border border-cerulean-800/30 will-change-transform h-full min-h-[140px] sm:min-h-40 flex flex-col items-center text-center justify-center"
    >
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-ink-black-800 to-cerulean-950 flex items-center justify-center mb-3 sm:mb-4 shadow-inner border border-cerulean-500/20"
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cerulean-400" />
      </div>
      <p className="text-xs sm:text-sm md:text-base text-ink-black-100 leading-relaxed font-medium">
        {text}
      </p>
    </motion.div>
  );
}

