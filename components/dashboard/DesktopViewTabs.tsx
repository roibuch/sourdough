"use client";

import {
  BookOpenIcon,
  ChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

export type DesktopMainTab = "outputs" | "guide" | "reference";

const TABS: {
  id: DesktopMainTab;
  label: string;
  icon: typeof ChartBarIcon;
}[] = [
  { id: "outputs", label: "חישוב ותוצאות", icon: ChartBarIcon },
  { id: "guide", label: "מדריך אפייה", icon: BookOpenIcon },
  { id: "reference", label: "טבלאות עזר", icon: TableCellsIcon },
];

interface DesktopViewTabsProps {
  active: DesktopMainTab;
  onSelect: (tab: DesktopMainTab) => void;
  guideVisible: boolean;
}

export function DesktopViewTabs({
  active,
  onSelect,
  guideVisible,
}: DesktopViewTabsProps) {
  const tabs = TABS.filter((t) => t.id !== "guide" || guideVisible);

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-warm-border/80 bg-white/60 p-1.5 shadow-sm backdrop-blur-sm"
      aria-label="תצוגת תוכן ראשי"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
              isActive
                ? "bg-crust text-dough shadow-md shadow-crust/20"
                : "text-charcoal-muted hover:bg-wheat-muted/60 hover:text-charcoal",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
