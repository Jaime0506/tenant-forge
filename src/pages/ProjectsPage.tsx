
import ProjectsView from "@/components/projects/ProjectsView";
import { AnimatedBackground } from "@/components/slide-presentation/AnimatedBackground";

// import useStoreManagement from "@/hooks/useStoreManagement";
// import { useNavigate } from "react-router";


export default function ProjectsPage() {
  // const navigate = useNavigate();
  // const { methods: { setIsFirstTimeInStore } } = useStoreManagement();

  // const handleResetFirstTime = async () => {
  //   try {
  //     await setIsFirstTimeInStore(true);
  //     navigate("/", { replace: true });
  //   } catch (error) {
  //     console.error("Error in handleResetFirstTime:", error);
  //   }
  // };

  // Test de comunicacion con Rust
  // const handleCreateUser = async () => {
  //   // Se prueba la comunicacion con Rust
  //   try {
  //     const result = await invoke("create_user", { name: "John Doe" });
  //     console.log("Result:", result);
  //   } catch (error) {
  //     console.error("Error in handleCreateUser:", error);
  //   }
  // };

  return (
    <main className="flex w-full h-screen bg-white dark:bg-slate-900 justify-center items-center">
      <AnimatedBackground />

      {/* <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Main Page</h1>
        <Button className="hover:cursor-pointer" onClick={handleResetFirstTime}>Reset first time</Button>
      </div> */}
      <ProjectsView />

    </main>
  )
}
