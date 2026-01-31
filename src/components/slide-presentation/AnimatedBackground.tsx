import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-ink-black-950">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[80px] sm:blur-[120px] will-change-transform opacity-15 ${i % 2 === 0 ? "bg-cerulean-500" : "bg-icy-aqua-500"
            }`}
          style={{
            width: 400 + i * 150,
            height: 400 + i * 150,
          }}
          initial={{
            x: `${(i * 25) % 100}%`,
            y: `${(i * 40) % 100}%`,
          }}
          animate={{
            x: [
              `${(i * 20) % 100}%`,
              `${((i * 20) + 60) % 120 - 10}%`,
              `${((i * 20) - 30) % 120 - 10}%`,
              `${(i * 20) % 100}%`,
            ],
            y: [
              `${(i * 30) % 100}%`,
              `${((i * 30) + 50) % 120 - 10}%`,
              `${((i * 30) - 40) % 120 - 10}%`,
              `${(i * 30) % 100}%`,
            ],
            scale: [1, 1.2, 0.9, 1],
            rotate: [0, 90, 180, 0],
          }}
          transition={{
            duration: 10 + i * 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

