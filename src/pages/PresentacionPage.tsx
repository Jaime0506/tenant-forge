import { SlidePresentation } from "@/components/slide-presentation";
import { motion } from "motion/react";

export default function PresentacionPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-screen"
    >
      <SlidePresentation />
    </motion.div>
  );
}
