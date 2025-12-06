import { motion } from "motion/react";

export function AppLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}
      className="mb-4 sm:mb-6 md:mb-8"
    >
      {/* <motion.div
        className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-2xl will-change-transform"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Database className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
        </motion.div>
      </motion.div> */}
      <motion.h1
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-3 md:mb-4 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-800 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 bg-clip-text text-transparent px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        TenantForge
      </motion.h1>
    </motion.div>
  );
}

