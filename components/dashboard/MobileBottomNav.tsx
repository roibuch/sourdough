"use client";

import {
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

export type MobileTab = "outputs" | "inputs" | "guide" | "reference";

const TABS: {
  id: MobileTab;
  label: string;
  icon: typeof CalendarDaysIcon;
}[] = [
  { id: "outputs", label: "לוח ותוצאות", icon: ChartBarIcon },
  { id: "inputs", label: "פרמטרים", icon: AdjustmentsHorizontalIcon },
  { id: "guide", label: "מדריך", icon: BookOpenIcon },
  { id: "reference", label: "ייחוס", icon: CalendarDaysIcon },
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
      <div className="flex items-stretch justify-around px-1 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn(
                "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 transition",
                isActive
                  ? "bg-wheat-muted text-crust shadow-[0_0_12px_rgb(212_165_116_/_0.35)] ring-1 ring-wheat/60"
                  : "text-charcoal-muted hover:bg-wheat-muted/40",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-semibold leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
