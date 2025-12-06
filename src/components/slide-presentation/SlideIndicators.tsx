interface SlideIndicatorsProps {
  totalSlides: number;
  currentSlide: number;
  onSlideClick: (index: number) => void;
}

export function SlideIndicators({
  totalSlides,
  currentSlide,
  onSlideClick,
}: SlideIndicatorsProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center items-center  mt-8">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSlideClick(index)}
          className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
            index === currentSlide
              ? "w-6 sm:w-8 bg-white"
              : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/75"
          }`}
        />
      ))}
    </div>
  );
}

