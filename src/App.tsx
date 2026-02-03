import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";
import DebugMenu from "./components/debug/DebugMenu";
import { useKonamiCode } from "./hooks/useKonamiCode";
import useStoreManagement from "./hooks/useStoreManagement";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

function App() {
  const { methods, isDebugModeEnabled } = useStoreManagement();

  // Ref para tener acceso al valor más actual dentro del callback sin recrearlo
  const isDebugModeEnabledRef = useRef(isDebugModeEnabled);

  useEffect(() => {
    isDebugModeEnabledRef.current = isDebugModeEnabled;
  }, [isDebugModeEnabled]);

  const toggleDebugMode = () => {
    const newState = !isDebugModeEnabledRef.current;
    methods.setIsDebugModeEnabledInStore(newState);
    toast.success(
      newState ? "Modo Debug Activado >:)" : "Modo Debug Desactivado :(",
      {
        description: "El sistema de depuración ha sido actualizado.",
      }
    );
  };

  useKonamiCode(toggleDebugMode);

  return (
    <main className="flex w-full h-screen">
      <AppRouter />
      <DebugMenu />
      <Toaster />
    </main>
  );
}

export default App;
