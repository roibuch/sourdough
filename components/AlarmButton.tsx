"use client";

import { useState } from "react";
import { BellAlertIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import {
  alarmResultMessage,
  alarmTimeTitle,
  isIOSDevice,
  openGoogleCalendarEvent,
  triggerHardwareAlarm,
  type AlarmResult,
} from "@/lib/alarms";
import { cn } from "@/lib/cn";

interface AlarmButtonProps {
  timestampMs: number;
  message: string;
  shortLabel: string;
  onResult?: (type: AlarmResult) => void;
}

export function AlarmButton({
  timestampMs,
  message,
  shortLabel,
  onResult,
}: AlarmButtonProps) {
  const [busy, setBusy] = useState(false);
  const ios = isIOSDevice();

  const run = async (fn: () => Promise<AlarmResult> | AlarmResult) => {
    setBusy(true);
    try {
      const result = await fn();
      onResult?.(result);
    } finally {
      setBusy(false);
    }
  };

  const btnClass = cn(
    "inline-flex min-h-[2.75rem] items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white",
    "shadow-md transition active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-60",
  );

  if (ios) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className={cn(btnClass, "bg-orange-700 shadow-orange-900/25 hover:bg-orange-800 focus-visible:ring-orange-500")}
          title={alarmTimeTitle(timestampMs)}
          onClick={() =>
            run(async () => triggerHardwareAlarm(timestampMs, message))
          }
        >
          <BellAlertIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{busy ? "פותח…" : `יומן · ${shortLabel}`}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          className={cn(
            btnClass,
            "bg-stone-700 shadow-stone-900/20 hover:bg-stone-800 focus-visible:ring-stone-500",
          )}
          title={alarmTimeTitle(timestampMs)}
          onClick={() =>
            run(() => openGoogleCalendarEvent(timestampMs, message))
          }
        >
          <CalendarDaysIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span>Google</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      className={cn(
        btnClass,
        "bg-orange-700 shadow-orange-900/25 hover:bg-orange-800 focus-visible:ring-orange-500",
      )}
      title={alarmTimeTitle(timestampMs)}
      onClick={() => run(async () => triggerHardwareAlarm(timestampMs, message))}
    >
      <BellAlertIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      <span>{busy ? "…" : `הוסף התראה · ${shortLabel}`}</span>
    </button>
  );
}

export function AlarmButtonGroup({
  alarms,
  onResult,
}: {
  alarms: { ts: number; message: string; short: string }[];
  onResult?: (type: AlarmResult) => void;
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

export function alarmToastMessage(result: AlarmResult): string {
  return alarmResultMessage(result);
}
