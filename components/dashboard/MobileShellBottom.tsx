"use client";

import { useEffect, useRef } from "react";
import { CalculatorIcon } from "@heroicons/react/24/outline";
import {
  MobileBottomNav,
  type MobileTab,
} from "@/components/dashboard/MobileBottomNav";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface MobileShellBottomProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  guideVisible: boolean;
  showCta: boolean;
  showResults: boolean;
  canCalculate: boolean;
  onCalculate: () => void;
  shellRef: React.RefObject<HTMLElement | null>;
}

/** Bottom chrome: optional CTA + tab navigation. Syncs shell padding vars. */
export function MobileShellBottom({
  activeTab,
  onSelectTab,
  guideVisible,
  showCta,
  showResults,
  canCalculate,
  onCalculate,
  shellRef,
}: MobileShellBottomProps) {
  const chromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const sync = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      if (desktop || !chromeRef.current) {
        shell.style.setProperty("--shell-nav-h", "0px");
        shell.style.setProperty("--shell-sticky-cta-h", "0px");
        return;
      }
      const navEl = chromeRef.current.querySelector("[data-mobile-nav]");
      const ctaEl = chromeRef.current.querySelector("[data-mobile-cta]");
      shell.style.setProperty(
        "--shell-nav-h",
        `${navEl?.getBoundingClientRect().height ?? 0}px`,
      );
      shell.style.setProperty(
        "--shell-sticky-cta-h",
        `${ctaEl?.getBoundingClientRect().height ?? 0}px`,
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    if (chromeRef.current) ro.observe(chromeRef.current);
    const mq = window.matchMedia("(min-width: 1024px)");
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [shellRef, showCta, showResults, activeTab]);

  const ctaLabel = showResults
    ? heContent.luxury.applyRecipe
    : heContent.inputs.actions.calculate;

  return (
    <div
      ref={chromeRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/98 backdrop-blur-md lg:hidden",
      )}
    >
      {showCta && (
        <div data-mobile-cta className="border-b border-border-subtle/80 px-3 py-2">
          <button
            type="button"
            className="cta-primary min-h-11 w-full gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canCalculate}
            onClick={onCalculate}
          >
            <CalculatorIcon
              className="h-5 w-5 shrink-0"
              strokeWidth={1.75}
              aria-hidden
            />
            {ctaLabel}
          </button>
        </div>
      )}
      <div
        data-mobile-nav
        className="pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      >
        <MobileBottomNav
          active={activeTab}
          onSelect={onSelectTab}
          guideVisible={guideVisible}
          embedded
        />
      </div>
    </div>
  );
}
