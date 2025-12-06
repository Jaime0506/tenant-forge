import { Routes, Route } from "react-router";
import PresentacionPage from "@/pages/PresentacionPage";
import MainPage from "@/pages/MainPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PresentacionPage />} />
      <Route path="/main" element={<MainPage />} />
    </Routes>
  )
}
