import { motion } from "motion/react";
import AppIcon from "../../../assets/app-icon.png";

export function AppLogo() {
  const text = "TenantForge";

  return (
    <div className="flex flex-col items-center justify-center gap-8 mb-8 sm:mb-12">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          delay: 1.2,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="relative"
      >
        <div className="absolute inset-0 bg-cerulean-500/10 blur-2xl rounded-full" />
        <img
          src={AppIcon}
          alt="TenantForge Icon"
          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 relative z-10 drop-shadow-[0_0_15px_rgba(8,191,247,0.15)]"
        />
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.1 }}
        className="flex overflow-hidden"
      >
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 }
            }}
            className="py-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-icy-aqua-50 bg-clip-text px-0.5 tracking-tighter"
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
