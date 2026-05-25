"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  balanceFlourAdjustIndex,
  balanceFlourProportional,
  sumFlourPcts,
} from "@/lib/flourBalance";
import { FLOUR_FIELDS } from "@/lib/flour";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const copy = heContent.flour.balanceDialog;

interface FlourBalanceDialogProps {
  open: boolean;
  pcts: number[];
  onCancel: () => void;
  onConfirm: (balanced: number[]) => void;
}

export function FlourBalanceDialog({
  open,
  pcts,
  onCancel,
  onConfirm,
}: FlourBalanceDialogProps) {
  const total = sumFlourPcts(pcts);
  const delta = Math.round((100 - total) * 10) / 10;
  const [mode, setMode] = useState<"proportional" | "single">("single");
  const [adjustIndex, setAdjustIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const maxIdx = pcts.reduce(
      (best, p, i) => (p > (pcts[best] ?? 0) ? i : best),
      0,
    );
    setAdjustIndex(maxIdx);
    setMode("single");
  }, [open, pcts]);

  if (!open) return null;

  const preview =
    mode === "proportional"
      ? balanceFlourProportional(pcts)
      : balanceFlourAdjustIndex(pcts, adjustIndex);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-charcoal/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flour-balance-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-warm-border bg-dough p-5 shadow-2xl">
        <h2
          id="flour-balance-title"
          className="font-serif text-lg font-semibold text-charcoal"
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {copy.body.replace("{total}", String(total)).replace("{delta}", String(delta))}
        </p>

        <div className="mt-4 space-y-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-warm-border/80 bg-white/70 px-3 py-2.5">
            <input
              type="radio"
              name="balance-mode"
              checked={mode === "single"}
              onChange={() => setMode("single")}
              className="h-5 w-5 shrink-0 accent-crust"
            />
            <span className="text-sm text-charcoal">{copy.adjustOne}</span>
          </label>
          {mode === "single" && (
            <select
              className="glass-input w-full text-start"
              value={adjustIndex}
              onChange={(e) => setAdjustIndex(Number(e.target.value))}
            >
              {FLOUR_FIELDS.map((f, i) => (
                <option key={f.key} value={i}>
                  {f.label} ({pcts[i] ?? 0}% → {preview[i]}%)
                </option>
              ))}
            </select>
          )}

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-warm-border/80 bg-white/70 px-3 py-2.5">
            <input
              type="radio"
              name="balance-mode"
              checked={mode === "proportional"}
              onChange={() => setMode("proportional")}
              className="h-5 w-5 shrink-0 accent-crust"
            />
            <span className="text-sm text-charcoal">{copy.proportional}</span>
          </label>
        </div>

        <p className="mt-3 text-xs text-stone-500">{copy.preview}</p>
        <ul className="mt-1 text-xs tabular-nums text-stone-600">
          {FLOUR_FIELDS.map((f, i) =>
            (preview[i] ?? 0) > 0 ? (
              <li key={f.key}>
                {f.label}: {preview[i]}%
              </li>
            ) : null,
          )}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            variant="primary"
            fullWidth
            onClick={() => onConfirm(preview)}
          >
            {copy.confirm}
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            {copy.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
