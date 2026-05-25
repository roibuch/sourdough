import { getBasePath } from "@/lib/basePath";
import { heContent } from "@/lib/content";
import { formatScheduleTime } from "./timeline";

const alarmCopy = heContent.alarms;
const PENDING_KEY = "sourdough-pending-notifications";
const MAX_NOTIFICATION_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

export const ALARM_MESSAGES = {
  pastTime: "השעה שנקבעה כבר עברה.",
  androidSuccess: "פותח/ת את אפליקציית השעון — אשרו את השעה ושמרו.",
  iosCopied: "השעה הועתקה! הוסף התראה בשעון.",
  icsDownloaded: "קובץ יומן ירד. פתח אותו לשמירת ההתראה.",
  notificationSet:
    "תזכורת בדפדפן בלבד — השאירו את הלשונית פתוחה. לשעון מערכת: אנדרואיד או קובץ יומן.",
  unsupported: "לא ניתן להגדיר התראה במכשיר זה.",
} as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** @deprecated Use isAndroid */
export const isAndroidDevice = isAndroid;

/** @deprecated Use isIOS */
export const isIOSDevice = isIOS;

/**
 * Android Clock intent — must be opened synchronously inside a click handler.
 * @param timestampMs Alarm time (local timezone hours/minutes)
 */
export function buildPrimaryAndroidAlarmUri(
  timestampMs: number,
  message: string,
): string {
  const date = new Date(timestampMs);
  const hours = Math.max(0, Math.min(23, date.getHours()));
  const minutes = Math.max(0, Math.min(59, date.getMinutes()));
  const msg = encodeURIComponent(message.slice(0, 120));

  return (
    `intent://set_alarm?hour=${hours}&minute=${minutes}&message=${msg}` +
    "#Intent;scheme=android-app;action=android.intent.action.SET_ALARM;end;"
  );
}

/** @deprecated Use buildPrimaryAndroidAlarmUri(timestampMs, message) */
export function buildPrimaryAndroidAlarmUriParts(
  hour: number,
  minute: number,
  message: string,
): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return buildPrimaryAndroidAlarmUri(d.getTime(), message);
}

export function buildAndroidAlarmIntents(
  timestampMs: number,
  message: string,
): string[] {
  const date = new Date(timestampMs);
  const h = Math.max(0, Math.min(23, date.getHours()));
  const m = Math.max(0, Math.min(59, date.getMinutes()));
  const msg = encodeURIComponent(message.slice(0, 120));

  const base =
    `i.android.intent.extra.alarm.HOUR=${h};` +
    `i.android.intent.extra.alarm.MINUTES=${m};` +
    `S.android.intent.extra.alarm.MESSAGE=${msg};` +
    `i.android.intent.extra.HOUR=${h};` +
    `i.android.intent.extra.MINUTES=${m};`;

  return [
    buildPrimaryAndroidAlarmUri(timestampMs, message),
    `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.google.android.deskclock;${base}end`,
    `intent:#Intent;action=android.intent.action.SET_ALARM;${base}end`,
    `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.sec.android.app.clockpackage;${base}end`,
  ];
}

/** Legacy-compatible SET_ALARM intent (no browser_fallback_url — avoids PWA reload). */
export function getAndroidAlarmHref(
  timestampMs: number,
  message: string,
): string {
  return buildPrimaryAndroidAlarmUri(timestampMs, message);
}

/**
 * Open Clock intent from a button click without navigating the PWA frame.
 * Uses target=_blank so standalone PWAs do not reload on failed intents.
 */
export function launchAndroidIntentViaAnchor(uri: string): void {
  const anchor = document.createElement("a");
  anchor.href = uri;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** @deprecated Prefer visible <a href={getAndroidAlarmHref(...)}> */
export function openAndroidClockAlarm(timestampMs: number, message: string): void {
  launchAndroidIntentViaAnchor(getAndroidAlarmHref(timestampMs, message));
}

/** @deprecated Prefer visible <a href={getAndroidAlarmHref(...)}> */
export function openAndroidClockAlarmMultiSync(
  timestampMs: number,
  message: string,
): void {
  launchAndroidIntentViaAnchor(getAndroidAlarmHref(timestampMs, message));
}

export function supportsScheduledNotifications(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as Window & { TimestampTrigger?: unknown })
    .TimestampTrigger !== "undefined";
}

export function generateIcsBlobUrl(
  timestampMs: number,
  title: string,
  description: string,
): string {
  const date = new Date(timestampMs);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const dtStart = formatIcsDate(date);
  const dtEnd = formatIcsDate(new Date(date.getTime() + 15 * 60_000));

  const safeTitle = title.replace(/[,;\\]/g, " ");
  const safeDesc = description.replace(/[,;\\]/g, " ");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SourdoughCalculator//HE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@sourdough.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeDesc}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${safeTitle}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  return URL.createObjectURL(blob);
}

/** Synchronous ICS download (safe inside click handler). */
export function downloadIcsAlarmSync(
  timestampMs: number,
  title: string,
  description = "תזכורת ממחשבון המחמצת",
): void {
  const icsUrl = generateIcsBlobUrl(timestampMs, title, description);
  const link = document.createElement("a");
  link.href = icsUrl;
  link.download = `sourdough-alarm-${timestampMs}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(icsUrl), 1000);
}

/** OS notification at a future time (works when app closed on Android Chrome). */
export async function scheduleTimestampTriggerNotification(
  timestampMs: number,
  message: string,
): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  const TimestampTriggerCtor = (
    window as Window & { TimestampTrigger?: new (ts: number) => unknown }
  ).TimestampTrigger;
  if (!TimestampTriggerCtor) return false;

  const delay = timestampMs - Date.now();
  if (delay <= 0 || delay > MAX_NOTIFICATION_DELAY_MS) return false;

  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const base = getBasePath();
    const icon = `${base}/icon-512x512.png`;
    const title = alarmCopy.ics.calendarName;
    const body = `${message} · ${formatScheduleTime(timestampMs)}`;
    const tag = `sourdough-alarm-${timestampMs}`;

    await reg.showNotification(title, {
      body,
      tag,
      icon,
      lang: "he",
      dir: "rtl",
      showTrigger: new TimestampTriggerCtor(timestampMs),
    } as NotificationOptions & { showTrigger: unknown });

    const id = `alarm-${timestampMs}`;
    const pending = loadPending().filter((a) => a.id !== id);
    pending.push({ id, ts: timestampMs, title, body });
    savePending(pending);
    return true;
  } catch {
    return false;
  }
}

export function scheduleServiceWorkerNotification(
  timestampMs: number,
  message: string,
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const delay = timestampMs - Date.now();
  if (delay <= 0 || delay > MAX_NOTIFICATION_DELAY_MS) return;

  const base = getBasePath();
  const icon = `${base}/icon-512x512.png`;

  window.setTimeout(() => {
    if (Notification.permission !== "granted") return;

    const show = (registration?: ServiceWorkerRegistration) => {
      const opts: NotificationOptions = {
        body: message,
        icon,
        tag: `sourdough-alarm-${timestampMs}`,
        lang: "he",
      };
      if (registration?.showNotification) {
        void registration.showNotification(alarmCopy.ics.calendarName, opts);
      } else {
        new Notification(alarmCopy.ics.calendarName, opts);
      }
    };

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then(show).catch(() => show());
    } else {
      show();
    }
  }, delay);
}

interface PendingNotification {
  id: string;
  ts: number;
  title: string;
  body: string;
}

function loadPending(): PendingNotification[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePending(list: PendingNotification[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

function fireBrowserNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag: `sourdough-${title}`,
      lang: "he",
    });
  } catch {
    /* blocked */
  }
}

function armTimeout(alarm: PendingNotification): void {
  const delay = alarm.ts - Date.now();
  if (delay <= 0 || delay > MAX_NOTIFICATION_DELAY_MS) return;
  window.setTimeout(() => {
    fireBrowserNotification(alarm.title, alarm.body);
    savePending(loadPending().filter((a) => a.id !== alarm.id));
  }, delay);
}

export function restorePendingNotifications(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const pending = loadPending().filter((a) => a.ts > now);
  savePending(pending);
  for (const alarm of pending) {
    armTimeout(alarm);
  }
}

export function scheduleWebNotification(
  timestampMs: number,
  message: string,
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") return false;

  const delay = timestampMs - Date.now();
  if (delay <= 0 || delay > MAX_NOTIFICATION_DELAY_MS) return false;

  scheduleServiceWorkerNotification(timestampMs, message);

  const title = alarmCopy.ics.calendarName;
  const body = `${message} · ${formatScheduleTime(timestampMs)}`;
  const id = `alarm-${timestampMs}`;

  const pending = loadPending().filter((a) => a.id !== id);
  pending.push({ id, ts: timestampMs, title, body });
  savePending(pending);
  armTimeout({ id, ts: timestampMs, title, body });
  return true;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function copyAlarmToClipboard(
  timestampMs: number,
  message: string,
): boolean {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  const timeString = new Date(timestampMs).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  void navigator.clipboard.writeText(`${timeString} — ${message}`);
  return true;
}

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
    `PRODID:-//${alarmCopy.ics.calendarName}//HE`,
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
      `DESCRIPTION:${alarmCopy.ics.calendarName}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT0M",
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
    details: alarmCopy.ics.calendarName,
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

export function downloadIcsBlob(ics: string, filename: string): void {
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

  if (isIOS() || isAndroid()) {
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
    alarmCopy.ics.exportTitle,
  );
  if (shared) return "shared";

  downloadIcsBlob(ics, "sourdough-schedule.ics");
  return "opened";
}

export type AlarmResult =
  | "android"
  | "android-fallback"
  | "ios-clock"
  | "ios-copied"
  | "scheduled"
  | "notification"
  | "shared"
  | "opened"
  | "google"
  | "invalid"
  | "past"
  | "unsupported";

/**
 * Android: synchronous only. iOS/desktop: returns "pending" for async follow-up.
 */
export function triggerClockAlarmImmediate(
  timestampMs: number,
  message: string,
): AlarmResult | "pending" {
  if (!timestampMs || Number.isNaN(timestampMs)) return "invalid";
  if (timestampMs <= Date.now()) return "past";

  if (isAndroid()) {
    try {
      openAndroidClockAlarmMultiSync(timestampMs, message);
      return "android";
    } catch {
      return "android-fallback";
    }
  }

  return "pending";
}

export async function triggerClockAlarmAsync(
  timestampMs: number,
  message: string,
): Promise<AlarmResult> {
  if (!timestampMs || Number.isNaN(timestampMs)) return "invalid";
  if (timestampMs <= Date.now()) return "past";

  if (isIOS()) {
    copyAlarmToClipboard(timestampMs, message);
    downloadIcsAlarmSync(timestampMs, message);
    return "ios-copied";
  }

  const scheduled = await scheduleTimestampTriggerNotification(
    timestampMs,
    message,
  );
  if (scheduled) return "scheduled";

  const granted = await ensureNotificationPermission();
  if (granted && scheduleWebNotification(timestampMs, message)) {
    return "notification";
  }

  downloadIcsAlarmSync(timestampMs, message);
  return "opened";
}

export async function triggerClockAlarm(
  timestampMs: number,
  message: string,
): Promise<AlarmResult> {
  const immediate = triggerClockAlarmImmediate(timestampMs, message);
  if (immediate !== "pending") {
    return immediate;
  }
  return triggerClockAlarmAsync(timestampMs, message);
}

/** @deprecated Use triggerClockAlarm */
export async function triggerHardwareAlarm(
  timestampMs: number,
  message: string,
): Promise<AlarmResult> {
  return triggerClockAlarm(timestampMs, message);
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
      return ALARM_MESSAGES.androidSuccess;
    case "android-fallback":
      return alarmCopy.results.androidFallback;
    case "ios-clock":
      return alarmCopy.results.iosClock;
    case "ios-copied":
      return `${ALARM_MESSAGES.iosCopied} ${ALARM_MESSAGES.icsDownloaded}`;
    case "scheduled":
      return alarmCopy.results.scheduled;
    case "notification":
      return ALARM_MESSAGES.notificationSet;
    case "shared":
      return isAndroid() ? alarmCopy.results.sharedAndroid : alarmCopy.results.sharedIos;
    case "opened":
      return ALARM_MESSAGES.icsDownloaded;
    case "google":
      return alarmCopy.results.google;
    case "past":
      return ALARM_MESSAGES.pastTime;
    case "unsupported":
      return ALARM_MESSAGES.unsupported;
    default:
      return alarmCopy.results.invalid;
  }
}
