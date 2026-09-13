import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { HashRouter } from "react-router";

// Aplica la preferencia del sistema como primer pintado, antes de que React
// monte y `ThemeToggle` conozca la preferencia guardada (evita un parpadeo
// del tema incorrecto). A partir de ahí, `ThemeToggle` toma el control:
// respeta "claro"/"oscuro" explícitos y solo sigue al sistema en vivo
// cuando la preferencia guardada es "system".
const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", isDark);

import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
