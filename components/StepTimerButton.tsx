"use client";

import { useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { startStepTimer } from "@/lib/stepTimer";
import { cn } from "@/lib/cn";

export function StepTimerButton({
  label,
  durationMinutes,
  onToast,
  className,
}: {
  label: string;
  durationMinutes: number;
  onToast?: (msg: string) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  if (!durationMinutes || durationMinutes <= 0) return null;

  const handleClick = () => {
    setBusy(true);
    void startStepTimer(label, durationMinutes)
      .then((r) => {
        if (r === "started") {
          onToast?.(`טיימר ל־${durationMinutes} דק׳ — ${label}`);
        } else if (r === "denied") {
          onToast?.("אשרו התראות בדפדפן כדי לקבל תזכורת בסוף הטיימר.");
        } else {
          onToast?.("הטיימר לא זמין בדפדפן זה.");
        }
      })
      .finally(() => setBusy(false));
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border-subtle",
        "bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-secondary",
        "hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "disabled:opacity-60",
        className,
      )}
    >
      <ClockIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
      {busy ? "…" : "הפעל טיימר"}
    </button>
  );
}
