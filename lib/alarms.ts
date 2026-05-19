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

/** Standard Android AlarmClock intent URIs (Chrome / WebView) */
export function buildAndroidAlarmIntents(
  hour: number,
  minute: number,
  message: string,
): string[] {
  const msg = encodeURIComponent(message.slice(0, 120));
  const h = Math.max(0, Math.min(23, hour));
  const m = Math.max(0, Math.min(59, minute));

  const base =
    `i.android.intent.extra.alarm.HOUR=${h};` +
    `i.android.intent.extra.alarm.MINUTES=${m};` +
    `S.android.intent.extra.alarm.MESSAGE=${msg};` +
    `i.android.intent.extra.HOUR=${h};` +
    `i.android.intent.extra.MINUTES=${m};`;

  return [
    `intent:#Intent;action=android.intent.action.SET_ALARM;${base}end`,
    `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.google.android.deskclock;${base}end`,
    `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.sec.android.app.clockpackage;${base}end`,
  ];
}

function navigateIntent(uri: string): void {
  const a = document.createElement("a");
  a.href = uri;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function openAndroidClockAlarm(
  hour: number,
  minute: number,
  message: string,
): void {
  for (const uri of buildAndroidAlarmIntents(hour, minute, message)) {
    try {
      navigateIntent(uri);
      return;
    } catch {
      /* try next */
    }
  }
  try {
    window.location.href = buildAndroidAlarmIntents(hour, minute, message)[0];
  } catch {
    /* fallback handled by caller */
  }
}

/** Local floating time — imports reliably into mobile calendars */
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

function downloadIcsBlob(ics: string, filename: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function downloadIcsAlarm(
  startMs: number,
  summary: string,
): Promise<"shared" | "opened" | "google"> {
  const ics = buildIcsCalendar([{ startMs, summary }]);

  if (isIOSDevice() || isAndroidDevice()) {
    const shared = await shareIcsFile(ics, "sourdough-reminder.ics", summary);
    if (shared) return "shared";
  }

  downloadIcsBlob(ics, "sourdough-reminder.ics");
  return "opened";
}

export async function exportAllAlarmsToCalendar(
  events: IcsEventInput[],
): Promise<"shared" | "opened" | "google" | "empty"> {
  if (!events.length) return "empty";
  const ics = buildIcsCalendar(events);

  const shared = await shareIcsFile(
    ics,
    "sourdough-schedule.ics",
    "לוח אפייה — מחמצת",
  );
  if (shared) return "shared";

  downloadIcsBlob(ics, "sourdough-schedule.ics");
  return "opened";
}

export type AlarmResult =
  | "android"
  | "android-fallback"
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
    openAndroidClockAlarm(hour, minute, message);
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
      return "אמור להיפתח אפליקציית השעון — אשרו/י את השעה ושמרו. אם לא נפתח, נסו «יומן».";
    case "android-fallback":
      return "לא נפתח שעון — נשלח קובץ יומן. פתחו/י אותו או בחרו «יומן» במסך השיתוף.";
    case "shared":
      return isAndroidDevice()
        ? "בחרו «שעון» או «יומן» / Google Calendar במסך השיתוף."
        : "בחרו «יומן» (Calendar) במסך השיתוף — האירוע ייכנס עם התראה.";
    case "opened":
      return isAndroidDevice()
        ? "נשמר קובץ .ics — פתחו/י ביומן או ב-Google Calendar."
        : isIOSDevice()
          ? "אם נפתח קובץ — לחצו «הוסף ליומן». אחרת השתמשו ב«יומן»."
          : "נשמר קובץ .ics — פתחו/י אותו ביומן.";
    case "google":
      return "נפתח Google Calendar — שמרו/י את האירוע.";
    default:
      return "אין שעה מתוכננת — בנו/י לוח זמנים קודם.";
  }
}
