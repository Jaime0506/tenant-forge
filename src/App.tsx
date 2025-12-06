import "./App.css";
import { Button } from "./components/ui/button";

function App() {
  // const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   setGreetMsg(await invoke("greet", { name }));
  // }

  return (
    <main className="container bg-red-500">
      Esto es una prueba de jaime
      <Button>Click me</Button>
    </main>
  );
}

export default App;
