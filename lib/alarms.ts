import { formatScheduleTime } from "./timeline";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function buildAndroidAlarmIntent(
  hour: number,
  minute: number,
  message: string,
): string {
  return (
    `intent://set_alarm?hour=${hour}&minute=${minute}&message=` +
    `${encodeURIComponent(message)}` +
    `#Intent;scheme=android-app;action=android.intent.action.SET_ALARM;end;`
  );
}

function formatIcsUtc(ms: number): string {
  const d = new Date(ms);
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

export function downloadIcsAlarm(startMs: number, summary: string): void {
  const endMs = startMs + 15 * 60_000;
  const uid = `sourdough-${startMs}@local`;
  const safe = summary.replace(/[,;\\]/g, " ");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sourdough Master//HE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(Date.now())}`,
    `DTSTART:${formatIcsUtc(startMs)}`,
    `DTEND:${formatIcsUtc(endMs)}`,
    `SUMMARY:${safe}`,
    "DESCRIPTION:Sourdough Master workflow reminder",
    "BEGIN:VALARM",
    "TRIGGER:-PT5M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${safe}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sourdough-alarm.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export type AlarmResult = "android" | "ics";

export function triggerHardwareAlarm(
  timestampMs: number,
  message: string,
): AlarmResult | "invalid" {
  if (!timestampMs || Number.isNaN(timestampMs)) return "invalid";
  const d = new Date(timestampMs);
  const hour = d.getHours();
  const minute = d.getMinutes();

  if (isAndroidDevice()) {
    window.location.href = buildAndroidAlarmIntent(hour, minute, message);
    return "android";
  }
  downloadIcsAlarm(timestampMs, message);
  return "ics";
}

export function alarmTimeTitle(timestampMs: number): string {
  return formatScheduleTime(timestampMs);
}
