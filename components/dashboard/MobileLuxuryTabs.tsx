"use client";

import { cn } from "@/lib/cn";
import { heContent } from "@/lib/content";

export type LuxuryMobileTab = "timeline" | "starter" | "guide";

const tabs = heContent.luxury.mobileTabs;

const ITEMS: { id: LuxuryMobileTab; label: string }[] = [
  { id: "timeline", label: tabs.timeline },
  { id: "starter", label: tabs.starter },
  { id: "guide", label: tabs.guide },
];

export function MobileLuxuryTabs({
  active,
  onSelect,
  guideVisible,
}: {
  active: LuxuryMobileTab;
  onSelect: (tab: LuxuryMobileTab) => void;
  guideVisible: boolean;
}) {
  return (
    <nav
      className="flex border-t border-border-subtle bg-surface/90 backdrop-blur-md"
      aria-label="תוספות למתכון"
    >
      {ITEMS.filter((t) => t.id !== "guide" || guideVisible).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            "min-h-[44px] flex-1 px-2 text-center text-xs font-medium tracking-wide transition-colors sm:text-sm",
            active === item.id
              ? "border-b-2 border-accent-gold text-text-primary"
              : "text-text-muted hover:text-text-secondary",
          )}
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
