import { heContent } from "@/lib/content";
import { formatScheduleTime } from "./timeline";

const alarmCopy = heContent.alarms;
const PENDING_KEY = "sourdough-pending-notifications";
const MAX_NOTIFICATION_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

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

/** Primary URI — matches legacy sourdough_app.html (Chrome / Android WebView). */
export function buildPrimaryAndroidAlarmUri(
  hour: number,
  minute: number,
  message: string,
): string {
  const h = Math.max(0, Math.min(23, hour));
  const m = Math.max(0, Math.min(59, minute));
  return (
    `intent://set_alarm?hour=${h}&minute=${m}&message=${encodeURIComponent(message.slice(0, 120))}` +
    "#Intent;scheme=android-app;action=android.intent.action.SET_ALARM;end;"
  );
}

/** Fallback intent variants with explicit clock packages */
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
    buildPrimaryAndroidAlarmUri(h, m, message),
    `intent:#Intent;action=android.intent.action.SET_ALARM;${base}end`,
    `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.google.android.deskclock;${base}end`,
    `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.sec.android.app.clockpackage;${base}end`,
  ];
}

/** Must run synchronously inside a click handler (user activation). */
export function openAndroidClockAlarm(
  hour: number,
  minute: number,
  message: string,
): void {
  const uris = buildAndroidAlarmIntents(hour, minute, message);
  window.location.assign(uris[0]);
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

/** Restore timers after reload (same tab session). */
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
  const text = `${message} — ${formatScheduleTime(timestampMs)}`;
  void navigator.clipboard.writeText(text);
  return true;
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

/** Synchronous download — safe inside click handler. */
export function downloadIcsAlarmSync(startMs: number, summary: string): void {
  const ics = buildIcsCalendar([{ startMs, summary }]);
  downloadIcsBlob(ics, "sourdough-reminder.ics");
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
  | "notification"
  | "shared"
  | "opened"
  | "google"
  | "invalid"
  | "past";

/**
 * Opens native clock UI on Android — must be called synchronously from click.
 * Returns "pending" when further async setup is needed (iOS / desktop).
 */
export function triggerClockAlarmImmediate(
  timestampMs: number,
  message: string,
): AlarmResult | "pending" {
  if (!timestampMs || Number.isNaN(timestampMs)) return "invalid";
  if (timestampMs <= Date.now()) return "past";

  const d = new Date(timestampMs);
  const hour = d.getHours();
  const minute = d.getMinutes();

  if (isAndroidDevice()) {
    openAndroidClockAlarm(hour, minute, message);
    return "android";
  }

  return "pending";
}

export async function triggerClockAlarmAsync(
  timestampMs: number,
  message: string,
): Promise<AlarmResult> {
  if (!timestampMs || Number.isNaN(timestampMs)) return "invalid";
  if (timestampMs <= Date.now()) return "past";

  const granted = await ensureNotificationPermission();
  if (granted && scheduleWebNotification(timestampMs, message)) {
    if (isIOSDevice()) {
      copyAlarmToClipboard(timestampMs, message);
    }
    return "notification";
  }

  if (isIOSDevice()) {
    copyAlarmToClipboard(timestampMs, message);
    const icsResult = await downloadIcsAlarm(timestampMs, message);
    return icsResult === "shared" ? "shared" : "opened";
  }

  downloadIcsAlarmSync(timestampMs, message);
  return "opened";
}

/** Full alarm flow: sync Android intent + async notification / calendar fallback. */
export async function triggerClockAlarm(
  timestampMs: number,
  message: string,
): Promise<AlarmResult> {
  const immediate = triggerClockAlarmImmediate(timestampMs, message);
  if (immediate !== "pending") {
    if (immediate === "android") {
      const granted = await ensureNotificationPermission();
      if (granted) scheduleWebNotification(timestampMs, message);
    }
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
  const r = alarmCopy.results;
  switch (result) {
    case "android":
      return r.android;
    case "ios-clock":
      return r.iosClock;
    case "android-fallback":
      return r.androidFallback;
    case "notification":
      return r.notification;
    case "shared":
      return isAndroidDevice() ? r.sharedAndroid : r.sharedIos;
    case "opened":
      return isAndroidDevice()
        ? r.openedAndroid
        : isIOSDevice()
          ? r.openedIos
          : r.openedDesktop;
    case "google":
      return r.google;
    case "past":
      return r.past;
    default:
      return r.invalid;
  }
}
