"use client";

import { BeakerIcon } from "@heroicons/react/24/outline";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const copy = heContent.bakingTimeline;

interface StarterFloatTestAlertProps {
  className?: string;
}

/** Compact reminder to float-test starter before mixing dough. */
export function StarterFloatTestAlert({ className }: StarterFloatTestAlertProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-2xl border border-amber-300/90 bg-gradient-to-br from-amber-50/95 via-wheat-50/80 to-white p-4 shadow-sm",
        className,
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900"
        aria-hidden
      >
        <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-charcoal">
          {copy.floatTestTitle}
          <InfoTooltip term="float-test" />
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
          {copy.floatTestBody}
        </p>
      </div>
    </div>
  );
}
