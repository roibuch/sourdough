"use client";

import { useState } from "react";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { BakerAlert, BakerAlertSeverity } from "@/lib/bakerAlerts";
import { cn } from "@/lib/cn";

const STYLES: Record<
  BakerAlertSeverity,
  { wrap: string; icon: string }
> = {
  info: {
    wrap: "border-sky-200/80 bg-sky-50/90 text-sky-950",
    icon: "text-sky-700",
  },
  warning: {
    wrap: "border-amber-300/80 bg-amber-50/95 text-amber-950",
    icon: "text-amber-700",
  },
  danger: {
    wrap: "border-red-300/80 bg-red-50/95 text-red-950",
    icon: "text-red-700",
  },
};

function SingleBanner({
  alert,
  onDismiss,
}: {
  alert: BakerAlert;
  onDismiss?: () => void;
}) {
  const s = STYLES[alert.severity];
  const Icon =
    alert.severity === "info"
      ? InformationCircleIcon
      : ExclamationTriangleIcon;

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-sm",
        s.wrap,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", s.icon)}
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{alert.title}</p>
        <p className="mt-0.5 text-sm leading-relaxed opacity-95">
          {alert.message}
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          aria-label="הסתר אזהרה"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function SmartWarningBanner({
  alerts,
  dismissible = true,
  className,
}: {
  alerts: BakerAlert[];
  dismissible?: boolean;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visible.map((alert) => (
        <SingleBanner
          key={alert.id}
          alert={alert}
          onDismiss={
            dismissible
              ? () =>
                  setDismissed((prev) => new Set(prev).add(alert.id))
              : undefined
          }
        />
      ))}
    </div>
  );
}
