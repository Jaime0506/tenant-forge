import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <main className="flex w-full h-screen">
      <AppRouter />
      <Toaster />
    </main>
  );
}

export default App;
