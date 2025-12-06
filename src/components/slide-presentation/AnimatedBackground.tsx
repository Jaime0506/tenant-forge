import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-100/40 dark:bg-blue-500/10 blur-3xl will-change-transform"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
          }}
          initial={{
            x: (i * 33) % 100,
            y: (i * 50) % 100,
          }}
          animate={{
            x: [
              `${(i * 33) % 100}%`,
              `${((i * 33) + 30) % 100}%`,
              `${(i * 33) % 100}%`,
            ],
            y: [
              `${(i * 50) % 100}%`,
              `${((i * 50) + 20) % 100}%`,
              `${(i * 50) % 100}%`,
            ],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

