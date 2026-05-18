"use client";

import { useEffect } from "react";
import { getBasePath } from "@/lib/basePath";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const base = getBasePath();
    const swUrl = `${base}/sw.js`;

    navigator.serviceWorker
      .register(swUrl, { scope: base ? `${base}/` : "/" })
      .catch(() => {
        /* optional offline support */
      });
  }, []);

  return null;
}
