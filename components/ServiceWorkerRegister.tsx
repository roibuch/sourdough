"use client";

import { useEffect, useRef } from "react";
import { restorePendingNotifications } from "@/lib/alarms";
import { getBasePath } from "@/lib/basePath";
import { heContent } from "@/lib/content";

const SW_URL_SUFFIX = "sw.js?v=9";
const RELOAD_KEY = "sourdough-sw-reload-v9";

export interface ServiceWorkerRegisterProps {
  /** Show toast instead of silent reload when a new SW activates */
  onUpdateAvailable?: (reload: () => void) => void;
}

export function ServiceWorkerRegister({
  onUpdateAvailable,
}: ServiceWorkerRegisterProps) {
  const reloaded = useRef(false);
  const updateToast = heContent.toasts.swUpdate;

  useEffect(() => {
    restorePendingNotifications();

    if (!("serviceWorker" in navigator)) return;

    const base = getBasePath();
    const swUrl = `${base}/${SW_URL_SUFFIX}`;

    const reload = () => {
      if (reloaded.current) return;
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      reloaded.current = true;
      window.location.reload();
    };

    const notifyUpdate = () => {
      if (onUpdateAvailable) {
        onUpdateAvailable(reload);
        return;
      }
      reload();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_ACTIVATED_V9") {
        notifyUpdate();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);

    const onControllerChange = () => {
      notifyUpdate();
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
  }, [onUpdateAvailable]);

  return null;
}
