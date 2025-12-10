import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface ButtonCustomProps extends React.ComponentProps<"button"> {
    children: React.ReactNode;
    isLoading?: boolean;
}

export default function ButtonCustom({ children, className, isLoading, ...props }: ButtonCustomProps) {
    return (
        <Button {...props} className={cn("hover:cursor-pointer", className)} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : children}
        </Button>
    )
}