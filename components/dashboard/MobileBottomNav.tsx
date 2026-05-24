"use client";

import {
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

export type MobileTab = "outputs" | "inputs" | "guide" | "reference";

const TABS: {
  id: MobileTab;
  label: string;
  icon: typeof ChartBarIcon;
}[] = [
  { id: "outputs", label: "לוח ותוצאות", icon: ChartBarIcon },
  { id: "inputs", label: "פרמטרים", icon: AdjustmentsHorizontalIcon },
  { id: "guide", label: "מדריך", icon: BookOpenIcon },
  { id: "reference", label: "טבלאות", icon: TableCellsIcon },
];

interface MobileBottomNavProps {
  active: MobileTab;
  onSelect: (tab: MobileTab) => void;
  guideVisible: boolean;
}

export function MobileBottomNav({
  active,
  onSelect,
  guideVisible,
}: MobileBottomNavProps) {
  const tabs = TABS.filter((t) => t.id !== "guide" || guideVisible);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-warm-border/80 lg:hidden",
        "bg-dough/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl",
      )}
      aria-label="ניווט ראשי"
    >
      <div className="flex items-stretch justify-around gap-0.5 px-1 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn(
                "flex min-h-[3rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1.5 transition sm:min-h-[3.25rem] sm:px-1 sm:py-2",
                isActive
                  ? "bg-wheat-muted text-crust shadow-[0_0_12px_rgb(212_165_116_/_0.35)] ring-1 ring-wheat/60"
                  : "text-charcoal-muted hover:bg-wheat-muted/40",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={isActive ? 2 : 1.5} />
              <span className="max-w-full truncate text-[9px] font-semibold leading-tight sm:text-[10px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
