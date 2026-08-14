import { registerRootComponent } from "expo";
import App from "./App";

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  // Capture beforeinstallprompt globally
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredPwaPrompt = e;
    if (typeof window.onPwaPromptCaptured === "function") {
      window.onPwaPromptCaptured(e);
    }
  });

  // Auto-register service worker on web
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

registerRootComponent(App);

