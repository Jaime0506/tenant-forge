import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { HashRouter } from "react-router";

// Detectar y aplicar tema oscuro basado en la preferencia del sistema
function applySystemTheme() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const htmlElement = document.documentElement;

  if (isDark) {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }
}

// Aplicar tema al cargar
applySystemTheme();

// Escuchar cambios en la preferencia del sistema
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySystemTheme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
