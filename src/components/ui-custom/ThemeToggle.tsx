import { useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import useStoreManagement from "@/hooks/useStoreManagement";

type ThemeOption = "system" | "light" | "dark";

const OPTIONS: { value: ThemeOption; icon: typeof Monitor; label: string }[] = [
  { value: "system", icon: Monitor, label: "Sistema" },
  { value: "light", icon: Sun, label: "Claro" },
  { value: "dark", icon: Moon, label: "Oscuro" },
];

export default function ThemeToggle() {
  const { theme, methods } = useStoreManagement();

  // Aplica el tema resuelto sobre <html>. En "system" sigue la preferencia
  // del sistema operativo en vivo; en "light"/"dark" la fuerza.
  useEffect(() => {
    if (theme === undefined) return; // aún cargando la preferencia guardada

    const html = document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const shouldBeDark = theme === "system" ? mql.matches : theme === "dark";
      html.classList.toggle("dark", shouldBeDark);
    };

    apply();

    if (theme === "system") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  const current: ThemeOption = (theme as ThemeOption | undefined) ?? "system";

  return (
    <div
      role="group"
      aria-label="Cambiar tema"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-1/90 border border-surface-border backdrop-blur-md shrink-0"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => methods.setThemeInStore(value)}
          aria-label={label}
          aria-pressed={current === value}
          title={label}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            current === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
          }`}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
