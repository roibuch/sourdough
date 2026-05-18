"use client";

import { BellAlertIcon } from "@heroicons/react/24/outline";
import { alarmTimeTitle, triggerHardwareAlarm } from "@/lib/alarms";
import { cn } from "@/lib/cn";

interface AlarmButtonProps {
  timestampMs: number;
  message: string;
  shortLabel: string;
  onResult?: (type: "android" | "ics" | "invalid") => void;
}

export function AlarmButton({
  timestampMs,
  message,
  shortLabel,
  onResult,
}: AlarmButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-[2.75rem] items-center gap-2 rounded-2xl bg-orange-700 px-4 py-2.5 text-sm font-bold text-white",
        "shadow-md shadow-orange-900/25 transition hover:bg-orange-800 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
      )}
      title={alarmTimeTitle(timestampMs)}
      onClick={() => {
        const result = triggerHardwareAlarm(timestampMs, message);
        onResult?.(result);
      }}
    >
      <BellAlertIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      <span>הוסף התראה · {shortLabel}</span>
    </button>
  );
}

export function AlarmButtonGroup({
  alarms,
  onResult,
}: {
  alarms: { ts: number; message: string; short: string }[];
  onResult?: (type: "android" | "ics" | "invalid") => void;
}) {
  if (!alarms.length) return null;
  return (
    <div className="flex flex-wrap gap-2.5">
      {alarms.map((a, i) => (
        <AlarmButton
          key={`${a.ts}-${i}`}
          timestampMs={a.ts}
          message={a.message}
          shortLabel={a.short}
          onResult={onResult}
        />
      ))}
    </div>
  );
}
