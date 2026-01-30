import { Routes, Route, useNavigate } from "react-router";
import PresentacionPage from "@/pages/PresentacionPage";
import ProjectsPage from "@/pages/ProjectsPage";
import useStoreManagement from "@/hooks/useStoreManagement";
import { useEffect } from "react";
import ProjectEditorPage from "@/pages/ProjectEditorPage";

export default function AppRouter() {
  const navigate = useNavigate();
  const { isFirstTime } = useStoreManagement();

  useEffect(() => {
    if (isFirstTime !== undefined && isFirstTime !== null && !isFirstTime) {
      navigate("/main");
    }
  }, [isFirstTime]);

  // Si es undefined o null, efecto de loading
  if (isFirstTime === undefined || isFirstTime === null) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<PresentacionPage />} />
      <Route path="/main" element={<ProjectsPage />} />
      <Route path="/project/:id" element={<ProjectEditorPage />} />
    </Routes>
  )
}
