import { motion, AnimatePresence } from "motion/react";
import { Slide } from "./slides";
import { AppLogo } from "./AppLogo";
import { SlideFeatureCard } from "./SlideFeatureCard";
import { FeatureCarousel } from "./FeatureCarousel";

interface SlideContentProps {
  slide: Slide;
  currentSlide: number;
}

export function SlideContent({ slide, currentSlide }: SlideContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSlide}
        initial={currentSlide === 0 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-6xl w-full text-center will-change-transform px-2"
      >
        {/* Logo/Title - only on first slide */}
        {currentSlide === 0 && <AppLogo />}

        {/* Slide subtitle */}
        {slide.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="text-xs sm:text-sm md:text-base text-cerulean-400 font-black mb-1 sm:mb-2 uppercase tracking-[0.2em] px-2"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {/* Slide title */}
        {slide.title && (
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-6 text-ink-black-50 px-2 sm:px-4 tracking-tight"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Main description */}
        {slide.content.main && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-ink-black-200 mb-6 max-w-2xl mx-auto px-2 sm:px-4 font-medium"
          >
            {slide.content.main}
          </motion.p>
        )}

        {/* Features list */}
        {slide.content.features.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="mb-6 sm:mb-8 md:mb-12"
          >
            {currentSlide === 2 ? (
              <FeatureCarousel features={slide.content.features} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-8">
                {slide.content.features.map((feature, index) => (
                  <SlideFeatureCard
                    key={index}
                    icon={feature.icon}
                    text={feature.text}
                    index={index}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

