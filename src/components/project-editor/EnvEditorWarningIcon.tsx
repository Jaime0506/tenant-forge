import { CircleAlert } from "lucide-react";
import { motion } from "motion/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface EnvEditorWarningIconProps {
    shouldAnimate: boolean;
}

export default function EnvEditorWarningIcon({ shouldAnimate }: EnvEditorWarningIconProps) {
    const icon = shouldAnimate ? (
        <motion.div
            initial={{ y: 0 }} // Empieza abajo
            animate={{
                y: [0, -6, 0], // Empieza abajo, sube, cae con rebote
            }}
            transition={{
                duration: 2,
                times: [0, 0.35, 1], // 35% sube, 65% cae y rebota
                ease: [
                    [0.25, 0.46, 0.45, 0.94], // Ease out quad - subida suave
                    smoothBounceEase, // Caída con rebote suave
                ],
                repeat: Infinity,
                repeatDelay: 1.5,
            }}
        >
            <CircleAlert className="size-5 text-yellow-500 font-bold" />
        </motion.div>
    ) : (
        <CircleAlert className="size-5 text-yellow-500 font-bold" />
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="cursor-pointer">{icon}</div>
            </TooltipTrigger>
            <TooltipContent>
                <button
                    onClick={() => {
                        // Handler para el click
                        console.log("Como usar? clicked");
                    }}
                    className="cursor-pointer hover:underline text-popover-foreground hover:text-primary transition-colors"
                >
                    Como usar?
                </button>
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * ================  Utils  =========================
 */

// From https://easings.net/#easeOutBounce
function bounceEase(x: number) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

// Easing que combina caída inicial suave con rebote
function smoothBounceEase(x: number) {
    // Los primeros 35% de la caída son suaves (ease in-out)
    if (x < 0.35) {
        // Ease in-out cubic para caída inicial muy suave
        const t = x / 0.35;
        const eased = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        return eased * 0.35; // Va de 0 a 0.35 suavemente
    }
    // El resto usa bounce ease normalizado al rango 0.35-1
    const normalizedX = (x - 0.35) / 0.65;
    const bounceValue = bounceEase(normalizedX);
    return 0.35 + 0.65 * bounceValue;
}

