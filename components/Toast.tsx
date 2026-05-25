"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export interface ToastAction {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type ToastPayload = string | ToastAction | null;

function normalize(payload: ToastPayload): ToastAction | null {
  if (!payload) return null;
  if (typeof payload === "string") return { message: payload };
  return payload;
}

export function Toast({ payload }: { payload: ToastPayload }) {
  const data = normalize(payload);
  const message = data?.message ?? null;
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
      className={`fixed left-1/2 z-[100] w-[min(calc(100vw-1.5rem),24rem)] -translate-x-1/2 transition-all duration-300 bottom-[calc(var(--shell-nav-h,4.25rem)+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-6 motion-reduce:transition-none ${
        message ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white/95 px-4 py-4 shadow-xl shadow-stone-400/20 backdrop-blur-md">
        <CheckCircleIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm font-medium leading-snug text-stone-800">
            {message}
          </p>
          {data?.actionLabel && data.onAction ? (
            <button
              type="button"
              className="touch-target self-start rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              onClick={() => {
                data.onAction?.();
                setVisible(false);
              }}
            >
              {data.actionLabel}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="touch-target rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="סגור"
          onClick={() => setVisible(false)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
