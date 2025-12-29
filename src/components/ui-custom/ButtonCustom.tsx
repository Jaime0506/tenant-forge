import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface ButtonCustomProps extends React.ComponentProps<"button"> {
    children: React.ReactNode;
    isLoading?: boolean;
}

export default function ButtonCustom({ children, className, isLoading, disabled, ...props }: ButtonCustomProps) {
    return (
        <Button
            {...props}
            className={cn("hover:cursor-pointer relative min-w-[32px]", className)}
            disabled={disabled || isLoading}
        >
            <span className={cn("flex items-center gap-2 transition-opacity duration-200", isLoading ? "opacity-0" : "opacity-100")}>
                {children}
            </span>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin size-4" />
                </div>
            )}
        </Button>
    )
}