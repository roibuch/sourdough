"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  const base =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/sourdough")
      ? "/sourdough"
      : "";

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
          background: "#faf6f0",
          color: "#2c2419",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            שגיאה בטעינת האפליקציה
          </h1>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, opacity: 0.9 }}>
            לרוב זה קורה אחרי עדכון האתר כשמטמון ישן נשאר בדפדפן. נסו רענון קשיח
            או הסרת Service Worker, ואז טענו מחדש.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
              marginTop: "1.25rem",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "#5c3d2e",
                color: "#faf6f0",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              נסו שוב
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("sourdough-sw-reload-v7");
                window.location.href = `${base}/`;
              }}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "0.75rem",
                border: "1px solid #c9a87c",
                background: "#fff",
                color: "#5c3d2e",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              טעינה מחדש
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
