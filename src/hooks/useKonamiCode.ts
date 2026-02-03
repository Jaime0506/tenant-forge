import { useEffect, useState } from "react";

const KONAMI_CODE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
];

export function useKonamiCode(onSuccess: () => void) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const key = event.key;
            const requiredKey = KONAMI_CODE[index];

            if (key === requiredKey) {
                // Move to next key
                const nextIndex = index + 1;
                if (nextIndex === KONAMI_CODE.length) {
                    // Sequence completed
                    onSuccess();
                    setIndex(0);
                } else {
                    setIndex(nextIndex);
                }
            } else {
                // Reset on mistake
                setIndex(0);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [index, onSuccess]);
}
