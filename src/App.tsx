import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";
import DebugMenu from "./components/debug/DebugMenu";

function App() {
  return (
    <main className="flex w-full h-screen">
      <AppRouter />
      <DebugMenu />
      <Toaster />
    </main>
  );
}

export default App;
