"use client";

import { useEffect, useRef } from "react";
import { restorePendingNotifications } from "@/lib/alarms";
import { getBasePath } from "@/lib/basePath";

const SW_URL_SUFFIX = "sw.js?v=8";
const RELOAD_KEY = "sourdough-sw-reload-v8";

export function ServiceWorkerRegister() {
  const reloaded = useRef(false);

  useEffect(() => {
    restorePendingNotifications();

    if (!("serviceWorker" in navigator)) return;

    const base = getBasePath();
    const swUrl = `${base}/${SW_URL_SUFFIX}`;

    const maybeReload = () => {
      if (reloaded.current) return;
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      reloaded.current = true;
      window.location.reload();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_ACTIVATED_V8") {
        maybeReload();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);

    const onControllerChange = () => {
      maybeReload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register(swUrl, { scope: base ? `${base}/` : "/", updateViaCache: "none" })
      .then((reg) => {
        reg.update().catch(() => {});
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      })
      .catch(() => {
        /* optional offline support */
      });

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
