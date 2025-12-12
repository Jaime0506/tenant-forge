import { useEffect, useState } from "react";

/**
 * Hook para detectar si el tema actual es oscuro
 */
export function useThemeDetector() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains("dark"));
        };

        // Verificar al montar
        checkTheme();

        // Observar cambios en el tema
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        // También escuchar cambios en la preferencia del sistema
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => checkTheme();
        mediaQuery.addEventListener("change", handleChange);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    return isDark;
}
