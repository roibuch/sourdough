/** Browser step timer — notification when duration ends. */

export function parseApproxDurationToMinutes(text: string): number | null {
  const t = text.trim();
  const range = t.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*שעות/);
  if (range) {
    const a = parseFloat(range[1]);
    const b = parseFloat(range[2]);
    return Math.round(((a + b) / 2) * 60);
  }
  const singleH = t.match(/(\d+(?:\.\d+)?)\s*שעות?/);
  if (singleH) return Math.round(parseFloat(singleH[1]) * 60);
  const mins = t.match(/(\d+)\s*דק/);
  if (mins) return parseInt(mins[1], 10);
  return null;
}

let activeTimerId: number | null = null;

export async function startStepTimer(
  label: string,
  durationMinutes: number,
): Promise<"started" | "denied" | "unsupported"> {
  if (typeof window === "undefined" || durationMinutes <= 0) {
    return "unsupported";
  }

  if (activeTimerId) {
    clearTimeout(activeTimerId);
    activeTimerId = null;
  }

  if ("Notification" in window && Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm === "denied") return "denied";
  }

  const ms = durationMinutes * 60_000;
  activeTimerId = window.setTimeout(() => {
    activeTimerId = null;
    const body = `${label} — הזמן הסתיים.`;
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("מאסטר מחמצת", { body, lang: "he", tag: "sourdough-step" });
      } catch {
        /* blocked */
      }
    }
  }, ms);

  return "started";
}
