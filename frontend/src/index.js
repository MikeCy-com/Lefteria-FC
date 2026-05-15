import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { installGreekAccentGuard } from "@/utils/greekAccentGuard";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Global Greek-accent guard — strips tonos marks from any uppercase-rendered text.
// Backstop on top of <html lang="el"> for cases where we manually call .toUpperCase().
installGreekAccentGuard();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
