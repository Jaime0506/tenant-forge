import { useState } from "react";
import { useNavigate } from "react-router";
import useStoreManagement from "./useStoreManagement";

export function useSlidePresentation(totalSlides: number) {
  const { methods: { setIsFirstTimeInStore } } = useStoreManagement();

  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = async () => {

    try {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide(currentSlide + 1);
      } else {
        await setIsFirstTimeInStore(false);
        navigate("/main", { replace: true });
      }
    } catch (error) {
      console.error("Error in nextSlide:", error);
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

