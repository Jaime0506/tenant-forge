import { Routes, Route, useNavigate, useLocation } from "react-router";
import PresentacionPage from "@/pages/PresentacionPage";
import ProjectsPage from "@/pages/ProjectsPage";
import useStoreManagement from "@/hooks/useStoreManagement";
import { useEffect } from "react";
import ProjectEditorPage from "@/pages/ProjectEditorPage";
import { AnimatePresence } from "motion/react";

export default function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();
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
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PresentacionPage />} />
        <Route path="/main" element={<ProjectsPage />} />
        <Route path="/project/:id" element={<ProjectEditorPage />} />
      </Routes>
    </AnimatePresence>
  )
}
