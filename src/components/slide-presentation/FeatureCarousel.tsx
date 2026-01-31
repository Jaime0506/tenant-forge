import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useAnimationFrame } from "motion/react";
import { SlideFeature } from "./slides";
import { SlideFeatureCard } from "./SlideFeatureCard";

interface FeatureCarouselProps {
    features: SlideFeature[];
}

export function FeatureCarousel({ features }: FeatureCarouselProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = useState(0);

    // Triple the features to ensure we always have content on both sides
    const infinitelyRepeatedFeatures = [...features, ...features, ...features];

    const x = useMotionValue(0);

    const updateDimensions = useCallback(() => {
        if (containerRef.current) {
            // contentWidth is the width of ONE set of items
            const scrollWidth = containerRef.current.scrollWidth;
            const singleSetWidth = scrollWidth / 3;
            setContentWidth(singleSetWidth);

            // Set initial position to the start of the second set
            if (x.get() === 0 && singleSetWidth > 0) {
                x.set(-singleSetWidth);
            }
        }
    }, [x]);

    useEffect(() => {
        updateDimensions();
        // Give it a moment to finish any layout shifts
        const timer = setTimeout(updateDimensions, 100);
        window.addEventListener("resize", updateDimensions);
        return () => {
            window.removeEventListener("resize", updateDimensions);
            clearTimeout(timer);
        };
    }, [updateDimensions, features]);

    useAnimationFrame((_, delta) => {
        if (isHovered || isDragging || contentWidth === 0) return;

        // pixels per ms (delta)
        const speed = 0.05;
        const moveBy = speed * delta;

        const currentX = x.get();
        let nextX = currentX - moveBy;

        // Loop logic: if we move past the end of the second set (into the third), 
        // jump back to the start of the second set.
        if (nextX <= -contentWidth * 2) {
            nextX += contentWidth;
        }

        x.set(nextX);
    });

    // Check boundaries and wrap-around on every update (drag or auto-play)
    const handleWrapAround = useCallback(() => {
        if (contentWidth === 0) return;
        const currentX = x.get();

        // If we move too far left (past the second set)
        if (currentX <= -contentWidth * 2) {
            x.set(currentX + contentWidth);
        }
        // If we move too far right (into the first set)
        else if (currentX >= 0) {
            x.set(currentX - contentWidth);
        }
    }, [contentWidth, x]);

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden py-10 cursor-grab active:cursor-grabbing select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                style={{ x }}
                drag="x"
                // No drag constraints - we handle the wrap-around manually
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                onUpdate={handleWrapAround}
                className="flex gap-6 w-max px-4"
            >
                {infinitelyRepeatedFeatures.map((feature, index) => (
                    <div key={index} className="w-[300px] sm:w-[350px] shrink-0">
                        <SlideFeatureCard
                            icon={feature.icon}
                            text={feature.text}
                            index={index % features.length}
                        />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
