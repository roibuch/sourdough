import { formatScheduleTime } from "./timeline";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
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

/** Local floating time — imports reliably into iPhone Calendar */
function formatIcsLocal(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}${pad2(d.getMinutes())}00`
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface IcsEventInput {
  startMs: number;
  durationMin?: number;
  summary: string;
}

export function buildIcsCalendar(events: IcsEventInput[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sourdough Master//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    const durationMin = ev.durationMin ?? 15;
    const endMs = ev.startMs + durationMin * 60_000;
    const uid = `sourdough-${ev.startMs}-${Math.random().toString(36).slice(2, 9)}@local`;
    const summary = escapeIcsText(ev.summary.replace(/[,;\\]/g, " "));

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsLocal(Date.now())}`,
      `DTSTART:${formatIcsLocal(ev.startMs)}`,
      `DTEND:${formatIcsLocal(endMs)}`,
      `SUMMARY:${summary}`,
      "DESCRIPTION:Sourdough Master",
      "BEGIN:VALARM",
      "TRIGGER:-PT10M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${summary}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function buildGoogleCalendarUrl(
  startMs: number,
  endMs: number,
  title: string,
): string {
  const fmt = (ms: number) => {
    const d = new Date(ms);
    return (
      `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}` +
      `T${pad2(d.getHours())}${pad2(d.getMinutes())}00`
    );
  };
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(startMs)}/${fmt(endMs)}`,
    details: "Sourdough Master",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function shareIcsFile(
  ics: string,
  filename: string,
  title: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    const file = new File([ics], filename, {
      type: "text/calendar;charset=utf-8",
    });
    const payload: ShareData = { title, files: [file] };
    if (navigator.canShare && !navigator.canShare(payload)) return false;
    await navigator.share(payload);
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return true;
    return false;
  }
}

function openIcsBlob(ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");
  if (!opened) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadIcsAlarm(
  startMs: number,
  summary: string,
): Promise<"shared" | "opened" | "google"> {
  const endMs = startMs + 15 * 60_000;
  const ics = buildIcsCalendar([{ startMs, summary }]);

  if (isIOSDevice()) {
    const shared = await shareIcsFile(ics, "sourdough-reminder.ics", summary);
    if (shared) return "shared";
    openIcsBlob(ics);
    return "opened";
  }

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sourdough-reminder.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  return "opened";
}

export async function exportAllAlarmsToCalendar(
  events: IcsEventInput[],
): Promise<"shared" | "opened" | "google" | "empty"> {
  if (!events.length) return "empty";
  const ics = buildIcsCalendar(events);

  if (isIOSDevice()) {
    const shared = await shareIcsFile(
      ics,
      "sourdough-schedule.ics",
      "לוח אפייה — מחמצת",
    );
    if (shared) return "shared";
    openIcsBlob(ics);
    return "opened";
  }

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sourdough-schedule.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  return "opened";
}

export type AlarmResult =
  | "android"
  | "shared"
  | "opened"
  | "google"
  | "invalid";

export async function triggerHardwareAlarm(
  timestampMs: number,
  message: string,
): Promise<AlarmResult> {
  if (!timestampMs || Number.isNaN(timestampMs)) return "invalid";
  const d = new Date(timestampMs);
  const hour = d.getHours();
  const minute = d.getMinutes();

  if (isAndroidDevice()) {
    window.location.href = buildAndroidAlarmIntent(hour, minute, message);
    return "android";
  }

  return downloadIcsAlarm(timestampMs, message);
}

export function openGoogleCalendarEvent(
  startMs: number,
  message: string,
): AlarmResult {
  if (!startMs || Number.isNaN(startMs)) return "invalid";
  const endMs = startMs + 15 * 60_000;
  window.open(buildGoogleCalendarUrl(startMs, endMs, message), "_blank");
  return "google";
}

export function alarmTimeTitle(timestampMs: number): string {
  return formatScheduleTime(timestampMs);
}

export function alarmResultMessage(result: AlarmResult): string {
  switch (result) {
    case "android":
      return "פותח/ת את שעון האנדרואיד…";
    case "shared":
      return "בחרו «יומן» (Calendar) במסך השיתוף — האירוע ייכנס עם התראה.";
    case "opened":
      return isIOSDevice()
        ? "אם נפתח קובץ — לחצו «הוסף ליומן». אחרת השתמשו בכפתור «שיתוף ליומן»."
        : "נשמר קובץ .ics — פתחו/י אותו ביומן.";
    case "google":
      return "נפתח Google Calendar — שמרו/י את האירוע (מסתנכרן גם ל-iPhone).";
    default:
      return "אין שעה מתוכננת — בנו/י לוח זמנים קודם.";
  }
}
