import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";
import DebugMenu from "./components/debug/DebugMenu";
import { useUpdateChecker } from "./hooks/useUpdateChecker";

function App() {
  useUpdateChecker();

  return (
    <main className="flex w-full h-screen">
      <AppRouter />
      <DebugMenu />
      <Toaster />
    </main>
  );
}

export default App;
