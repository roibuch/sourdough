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
      className="mx-4 flex gap-1 rounded-xl border border-border-subtle bg-surface p-1 shadow-sm"
      aria-label="תוספות למתכון"
    >
      {ITEMS.filter((t) => t.id !== "guide" || guideVisible).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            "min-h-[44px] flex-1 rounded-lg px-2 text-center text-sm font-medium transition-colors",
            active === item.id
              ? "bg-accent text-white shadow-sm"
              : "text-text-secondary hover:bg-stone-50 hover:text-text-primary",
          )}
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
