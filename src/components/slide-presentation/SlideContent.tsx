import { motion, AnimatePresence } from "motion/react";
import { Slide } from "./slides";
import { AppLogo } from "./AppLogo";
import { SlideFeatureCard } from "./SlideFeatureCard";

interface SlideContentProps {
  slide: Slide;
  currentSlide: number;
}

export function SlideContent({ slide, currentSlide }: SlideContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSlide}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-4xl w-full text-center will-change-transform px-2 sm:px-4 md:px-6"
      >
        {/* Logo/Title - only on first slide */}
        {currentSlide === 0 && <AppLogo />}

        {/* Slide subtitle */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="text-xs sm:text-sm md:text-base text-blue-700 dark:text-blue-400 font-medium mb-1 sm:mb-2 uppercase tracking-wider px-2"
        >
          {slide.subtitle}
        </motion.p>

        {/* Slide title */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-slate-900 dark:text-blue-100 px-2 sm:px-4"
        >
          {slide.title}
        </motion.h2>

        {/* Main description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-700 dark:text-blue-300 mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto px-2 sm:px-4"
        >
          {slide.content.main}
        </motion.p>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12"
        >
          {slide.content.features.map((feature, index) => (
            <SlideFeatureCard
              key={index}
              icon={feature.icon}
              text={feature.text}
              index={index}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

