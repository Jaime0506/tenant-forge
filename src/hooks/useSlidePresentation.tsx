import { useState } from "react";
import { useNavigate } from "react-router";

export function useSlidePresentation(totalSlides: number) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/main");
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    isFirstSlide: currentSlide === 0,
    isLastSlide: currentSlide === totalSlides - 1,
  };
}

