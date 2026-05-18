"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function Toast({ message }: { message: string | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(t);
  }, [message]);

  if (!message && !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[100] w-[min(92vw,24rem)] -translate-x-1/2 transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-xl shadow-stone-400/20">
        <CheckCircleIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
          strokeWidth={1.75}
          aria-hidden
        />
        <p className="flex-1 text-sm font-medium leading-snug text-stone-800">
          {message}
        </p>
        <button
          type="button"
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="סגור"
          onClick={() => setVisible(false)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
