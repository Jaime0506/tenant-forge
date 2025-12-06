import { useState } from "react";
import { useNavigate } from "react-router";
import useStoreManagement from "./useStoreManagement";

export function useSlidePresentation(totalSlides: number) {
  const { methods: { setIsFirstTimeInStore } } = useStoreManagement();

  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = async () => {
    console.log("nextSlide called, currentSlide:", currentSlide, "totalSlides:", totalSlides);
    try {
      if (currentSlide < totalSlides - 1) {
        console.log("Moving to next slide");
        setCurrentSlide(currentSlide + 1);
      } else {
        console.log("Last slide, setting isFirstTime to false");
        await setIsFirstTimeInStore(false);
        console.log("Navigating to /main");
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

