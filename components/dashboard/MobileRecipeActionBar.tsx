"use client";

import { useEffect, useRef } from "react";
import { CalculatorIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface MobileRecipeActionBarProps {
  showResults: boolean;
  canCalculate: boolean;
  onCalculate: () => void;
  onOpenEdit?: () => void;
  hidden?: boolean;
  shellRef: React.RefObject<HTMLElement | null>;
}

/** Compact fixed CTA row on mobile — height synced to --shell-sticky-cta-h */
export function MobileRecipeActionBar({
  showResults,
  canCalculate,
  onCalculate,
  onOpenEdit,
  hidden,
  shellRef,
}: MobileRecipeActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const syncHeight = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      if (desktop || hidden || !barRef.current) {
        shell.style.setProperty("--shell-sticky-cta-h", "0px");
        return;
      }
      shell.style.setProperty(
        "--shell-sticky-cta-h",
        `${barRef.current.offsetHeight}px`,
      );
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    if (barRef.current) ro.observe(barRef.current);
    const mq = window.matchMedia("(min-width: 1024px)");
    mq.addEventListener("change", syncHeight);
    window.addEventListener("resize", syncHeight);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", syncHeight);
      window.removeEventListener("resize", syncHeight);
    };
  }, [hidden, shellRef, showResults]);

  if (hidden) return null;

  const label = showResults
    ? heContent.luxury.applyRecipe
    : heContent.inputs.actions.calculate;

  return (
    <div
      ref={barRef}
      className={cn(
        "fixed inset-x-0 z-40 border-t border-border-subtle bg-surface/98 backdrop-blur-md lg:hidden",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
      )}
      role="region"
      aria-label="פעולות מתכון"
    >
      <div className="flex items-stretch gap-2 px-3 py-2">
        {showResults && onOpenEdit && (
          <button
            type="button"
            className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle text-text-secondary hover:bg-surface-elevated"
            onClick={onOpenEdit}
            aria-label={heContent.luxury.editRecipe}
          >
            <PencilSquareIcon className="h-5 w-5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="cta-primary min-h-11 flex-1 gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canCalculate}
          onClick={onCalculate}
        >
          <CalculatorIcon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          {label}
        </button>
      </div>
    </div>
  );
}
