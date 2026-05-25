"use client";

import { useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import {
  alarmResultMessage,
  alarmTimeTitle,
  downloadIcsAlarm,
  downloadIcsAlarmSync,
  getAndroidAlarmHref,
  isAndroid,
  isIOS,
  openGoogleCalendarEvent,
  scheduleTimestampTriggerNotification,
  scheduleWebNotification,
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
  const isValidFuture =
    Boolean(timestampMs) &&
    !Number.isNaN(timestampMs) &&
    timestampMs > Date.now();
  const androidHref =
    isAndroid() && isValidFuture
      ? getAndroidAlarmHref(timestampMs, message)
      : null;

  const notify = (result: AlarmResult) => {
    onResult?.(result);
  };

  const fallbackToIcsSync = () => {
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
      fallbackToIcsSync();
      notify("ios-copied");
      return;
    }

    const scheduled = await scheduleTimestampTriggerNotification(
      timestampMs,
      message,
    );
    if (scheduled) {
      notify("scheduled");
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted" && scheduleWebNotification(timestampMs, message)) {
        notify("notification");
        return;
      }
    }

    fallbackToIcsSync();
  };

  const handleAlarmClick = () => {
    if (!timestampMs || Number.isNaN(timestampMs)) {
      notify("invalid");
      return;
    }

    if (timestampMs <= Date.now()) {
      notify("past");
      return;
    }

    setBusy(true);
    void handleIOSAndDesktopFlow()
      .catch(() => {
        fallbackToIcsSync();
        notify("unsupported");
      })
      .finally(() => setBusy(false));
  };

  const btnClass = cn(
    "inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-sm font-medium text-background",
    compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
    "shadow-md motion-safe:transition-all active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:opacity-60",
  );

  const optionalClass = cn(
    "inline-flex min-h-[44px] min-w-[44px] items-center rounded-xl px-3 py-2 text-xs font-semibold",
    "border border-border-subtle bg-surface text-text-secondary",
    "hover:border-accent-gold/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:opacity-60",
  );

  const alarmLabel = busy
    ? alarmUi.busy
    : compact
      ? shortLabel
      : `${alarmUi.clock} · ${shortLabel}`;

  return (
    <div className={cn("inline-flex flex-col gap-1.5", compact && "w-full min-w-0")}>
      {androidHref ? (
        <a
          href={androidHref}
          className={cn(
            btnClass,
            "bg-accent shadow-sm hover:bg-accent-hover no-underline",
            compact && "w-full justify-center",
          )}
          title={alarmTimeTitle(timestampMs)}
          aria-label={`${alarmUi.clock} · ${shortLabel}`}
          onClick={() => notify("android")}
        >
          <ClockIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{alarmLabel}</span>
        </a>
      ) : (
        <button
          type="button"
          disabled={busy}
          className={cn(
            btnClass,
            "bg-accent shadow-sm hover:bg-accent-hover",
            compact && "w-full justify-center",
          )}
          title={alarmTimeTitle(timestampMs)}
          onClick={handleAlarmClick}
          aria-label={`${alarmUi.clock} · ${shortLabel}`}
        >
          <ClockIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{alarmLabel}</span>
        </button>
      )}

      {mobile && !compact && (
        <>
          <button
            type="button"
            className="min-h-[44px] self-start text-xs font-medium text-text-muted underline-offset-2 hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            onClick={() => setShowOptional((v) => !v)}
            aria-expanded={showOptional}
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
                aria-label={alarmUi.calendar}
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
                aria-label={alarmUi.googleCalendar}
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
