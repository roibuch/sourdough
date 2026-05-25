"use client";

import { useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import {
  alarmResultMessage,
  alarmTimeTitle,
  buildPrimaryAndroidAlarmUri,
  downloadIcsAlarm,
  downloadIcsAlarmSync,
  isAndroid,
  isIOS,
  openGoogleCalendarEvent,
  scheduleServiceWorkerNotification,
  type AlarmResult,
} from "@/lib/alarms";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const alarmUi = heContent.alarms.buttons;

interface AlarmButtonProps {
  timestampMs: number;
  message: string;
  shortLabel: string;
  compact?: boolean;
  onResult?: (type: AlarmResult) => void;
}

export function AlarmButton({
  timestampMs,
  message,
  shortLabel,
  compact = false,
  onResult,
}: AlarmButtonProps) {
  const [busy, setBusy] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const mobile = isAndroid() || isIOS();

  const notify = (result: AlarmResult) => {
    onResult?.(result);
  };

  const fallbackToIcs = () => {
    downloadIcsAlarmSync(timestampMs, message);
    notify("opened");
  };

  const handleIOSAndDesktopFlow = async () => {
    if (isIOS()) {
      try {
        const timeString = new Date(timestampMs).toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        await navigator.clipboard.writeText(`${timeString} — ${message}`);
      } catch {
        /* clipboard blocked */
      }
      fallbackToIcs();
      notify("ios-copied");
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        scheduleServiceWorkerNotification(timestampMs, message);
        notify("notification");
        return;
      }
    }

    fallbackToIcs();
  };

  const handleAlarmClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!timestampMs || Number.isNaN(timestampMs)) {
      notify("invalid");
      return;
    }

    if (timestampMs <= Date.now()) {
      notify("past");
      return;
    }

    // ANDROID: strictly synchronous — no await before intent (user activation)
    if (isAndroid()) {
      try {
        const intentUri = buildPrimaryAndroidAlarmUri(timestampMs, message);
        window.location.assign(intentUri);
        notify("android");
      } catch (err) {
        console.error("Android intent failed", err);
        fallbackToIcs();
        notify("android-fallback");
      }
      return;
    }

    setBusy(true);
    void handleIOSAndDesktopFlow()
      .catch(() => {
        fallbackToIcs();
        notify("unsupported");
      })
      .finally(() => setBusy(false));
  };

  const btnClass = cn(
    "inline-flex items-center gap-2 rounded-2xl font-bold text-white",
    compact
      ? "min-h-11 px-3 py-2 text-xs"
      : "min-h-11 px-4 py-2.5 text-sm",
    "shadow-md transition active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-60",
  );

  const optionalClass = cn(
    "inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-semibold",
    "border border-stone-300 bg-white text-stone-700",
    "hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wheat/40",
    "disabled:opacity-60",
  );

  return (
    <div className={cn("inline-flex flex-col gap-1.5", compact && "w-full min-w-0")}>
      <button
        type="button"
        disabled={busy}
        className={cn(
          btnClass,
          "bg-orange-700 shadow-orange-900/25 hover:bg-orange-800 focus-visible:ring-orange-500",
          compact && "w-full justify-center",
        )}
        title={alarmTimeTitle(timestampMs)}
        onClick={handleAlarmClick}
        aria-label={`${alarmUi.clock} · ${shortLabel}`}
      >
        <ClockIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        <span>
          {busy ? alarmUi.busy : compact ? shortLabel : `${alarmUi.clock} · ${shortLabel}`}
        </span>
      </button>

      {mobile && !compact && (
        <>
          <button
            type="button"
            className="self-start text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
            onClick={() => setShowOptional((v) => !v)}
          >
            {showOptional ? "הסתר אפשרויות נוספות" : "אפשרויות נוספות (יומן)"}
          </button>
          {showOptional && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className={optionalClass}
                title={alarmTimeTitle(timestampMs)}
                onClick={() => {
                  setBusy(true);
                  void downloadIcsAlarm(timestampMs, message)
                    .then((r) => notify(r === "shared" ? "shared" : "opened"))
                    .finally(() => setBusy(false));
                }}
              >
                {alarmUi.calendar}
              </button>
              <button
                type="button"
                disabled={busy}
                className={optionalClass}
                title={alarmTimeTitle(timestampMs)}
                onClick={() => notify(openGoogleCalendarEvent(timestampMs, message))}
              >
                {alarmUi.googleCalendar}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function AlarmButtonGroup({
  alarms,
  onResult,
  compact,
  stacked,
}: {
  alarms: { ts: number; message: string; short: string }[];
  onResult?: (type: AlarmResult) => void;
  compact?: boolean;
  stacked?: boolean;
}) {
  if (!alarms.length) return null;
  return (
    <div
      className={cn(
        "flex gap-2",
        stacked || compact ? "w-full min-w-0 flex-col" : "flex-wrap gap-2.5",
      )}
    >
      {alarms.map((a, i) => (
        <AlarmButton
          key={`${a.ts}-${i}`}
          timestampMs={a.ts}
          message={a.message}
          shortLabel={a.short}
          compact={compact}
          onResult={onResult}
        />
      ))}
    </div>
  );
}

export function alarmToastMessage(result: AlarmResult): string {
  return alarmResultMessage(result);
}
