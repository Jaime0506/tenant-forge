import { Routes, Route, useNavigate } from "react-router";
import PresentacionPage from "@/pages/PresentacionPage";
import MainPage from "@/pages/MainPage";
import useStoreManagement from "@/hooks/useStoreManagement";
import { useEffect } from "react";
import ProjectPage from "@/pages/ProjectPage";

export default function AppRouter() {
  const navigate = useNavigate();
  const { isFirstTime } = useStoreManagement();

  useEffect(() => {
    console.log('CAMBIO ');
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
      <Route path="/main" element={<MainPage />} />
      <Route path="/project/:id" element={<ProjectPage />} />
    </Routes>
  )
}
