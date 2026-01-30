import { AnimatedBackground } from "./AnimatedBackground";
import { SlideIndicators } from "./SlideIndicators";
import { SlideContent } from "./SlideContent";
import { NavigationButtons } from "./NavigationButtons";
import { slides } from "./slides";
import { useSlidePresentation } from "@/hooks/useSlidePresentation";

export function SlidePresentation() {
  const {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    isFirstSlide,
    isLastSlide,
  } = useSlidePresentation(slides.length);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-ink-black-950">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-y-auto">
        <SlideContent slide={currentSlideData} currentSlide={currentSlide} />
        <NavigationButtons
          onPrev={prevSlide}
          onNext={nextSlide}
          showPrev={!isFirstSlide}
          isLastSlide={isLastSlide}
        />
        <SlideIndicators
          totalSlides={slides.length}
          currentSlide={currentSlide}
          onSlideClick={goToSlide}
        />
      </div>
    </div>
  );
}
