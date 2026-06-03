"use client";

import { BeakerIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/cn";

/** Float-test hint — inline in starter section, or card in guide */
export function FloatTestCompact({
  className,
  variant = "card",
}: {
  className?: string;
  variant?: "card" | "inline";
}) {
  if (variant === "inline") {
    return (
      <p
        className={cn(
          "m-0 text-xs leading-relaxed text-text-secondary",
          className,
        )}
      >
        <span className="font-medium text-amber-900">מבחן הציפה</span> לפני
        הלישה — כף במים:{" "}
        <strong className="text-amber-950">צפה = מוכנה</strong>
        <InfoTooltip term="float-test" hover />
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-400/60 bg-amber-50/80 px-3 py-2",
        className,
      )}
    >
      <p className="m-0 text-xs font-medium text-amber-950">
        לפני הלישה — מבחן הציפה
        <InfoTooltip term="float-test" hover />
        <span className="font-normal text-stone-700">
          {" "}
          · צפה = מוכנה; שוקעת = עוד המתנה
        </span>
      </p>
    </div>
  );
}

export function FloatTestReminderContent() {
  return (
      <article
        className={cn(
          "rounded-2xl border-2 border-amber-400/80 p-5 shadow-md sm:p-6",
          "bg-gradient-to-br from-amber-50 via-wheat-50 to-white",
          "ring-2 ring-amber-200/50",
        )}
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h4 className="m-0 flex flex-wrap items-center gap-2 font-serif text-lg font-semibold text-charcoal">
            לפני הלישה — מבחן הציפה
            <InfoTooltip term="float-test" />
          </h4>
          <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-950">
            מומלץ מאוד
          </span>
        </div>

        <p className="m-0 text-sm leading-relaxed text-stone-700">
          לפני הוספת מחמצת ומלח — ודאו שהמחמצת בשיא. כף קטנה במים:
          <strong className="text-amber-950"> צפה = מוכנה</strong>, שוקעת =
          עוד האכלה או חום עדין.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          {[
            "מלאו כוס/קערית במים בטמפרטורת החדר",
            "הניחו כף מחמצת בעדינות — לא לדחוץ",
            "צפה בשטח כמה שניות → מערבבים בבצק",
            "שוקעת? המתינו 1–2 שעות או חממו מעט את המחמצת",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <CheckCircleIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-crust"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div
          className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-amber-200/80 bg-white/80 px-4 py-3"
          aria-hidden
        >
          <span className="text-3xl">🥄</span>
          <span className="text-2xl text-stone-400">→</span>
          <span className="text-3xl">💧</span>
          <span className="text-2xl text-stone-400">→</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900">
            צף ✓
          </span>
        </div>
      </article>
  );
}

export function FloatTestReminder({ className }: { className?: string }) {
  return (
    <li
      className={cn(
        "relative list-none pb-8 pr-14 last:pb-0 sm:pr-16",
        className,
      )}
      aria-label="תזכורת מבחן הציפה"
    >
      <span
        className="absolute right-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-amber-900 shadow-md"
        aria-hidden
      >
        <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <FloatTestReminderContent />
    </li>
  );
}

export function FloatTestReminderRailDot() {
  return (
    <span
      className="absolute right-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-amber-900 shadow-md"
      aria-hidden
    >
      <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

/** Step title that triggers float test block before it */
export function isMixingPhaseStep(title: string): boolean {
  return title.includes("הוספת מחמצת, מלח");
}
