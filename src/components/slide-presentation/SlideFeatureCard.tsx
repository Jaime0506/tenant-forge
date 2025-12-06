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
      whileHover={{ scale: 1.03, y: -3 }}
      className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-md border-2 border-blue-100 dark:border-blue-700/50 will-change-transform hover:shadow-lg transition-shadow"
    >
      <motion.div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 sm:mb-4 shadow-md mx-auto will-change-transform"
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </motion.div>
      <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-blue-300 leading-relaxed">
        {text}
      </p>
    </motion.div>
  );
}

