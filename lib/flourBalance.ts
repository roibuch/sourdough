import { FLOUR_FIELDS } from "@/lib/flour";
import { normalizeFlourPercentages } from "@/lib/schemas/recipeParamsSchema";

export function sumFlourPcts(pcts: number[]): number {
  return Math.round(pcts.reduce((s, p) => s + (Number.isFinite(p) ? p : 0), 0) * 10) / 10;
}

/** Clamp only — no rescaling while user types */
export function sanitizeFlourDraft(pcts: number[]): number[] {
  return pcts.map((p) => {
    const n = typeof p === "number" ? p : parseFloat(String(p));
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  });
}

/** Add remainder to one chosen flour (delta = 100 − total) */
export function balanceFlourAdjustIndex(
  pcts: number[],
  adjustIndex: number,
): number[] {
  const clean = sanitizeFlourDraft(pcts);
  const total = sumFlourPcts(clean);
  const delta = Math.round((100 - total) * 10) / 10;
  const next = [...clean];
  const i = Math.min(Math.max(0, adjustIndex), next.length - 1);
  next[i] = Math.round((next[i] + delta) * 10) / 10;
  if (sumFlourPcts(next) !== 100) {
    return normalizeFlourPercentages(next);
  }
  return next;
}

export function balanceFlourProportional(pcts: number[]): number[] {
  return normalizeFlourPercentages(sanitizeFlourDraft(pcts));
}

export function flourLabelsForBalance(): { index: number; label: string; pct: number }[] {
  return FLOUR_FIELDS.map((f, index) => ({ index, label: f.label, pct: 0 }));
}
