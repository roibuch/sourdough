"use client";

import { cn } from "@/lib/cn";

export type AppSegment =
  | "recipe"
  | "starter"
  | "guide"
  | "reference";

const ITEMS: { id: AppSegment; label: string }[] = [
  { id: "recipe", label: "המתכון" },
  { id: "guide", label: "מדריך" },
  { id: "starter", label: "האכלת מחמצת" },
  { id: "reference", label: "טבלאות עזר" },
];

export function AppSegmentNav({
  active,
  onSelect,
  guideVisible,
  className,
}: {
  active: AppSegment;
  onSelect: (id: AppSegment) => void;
  guideVisible: boolean;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-border-subtle bg-surface-elevated p-1",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="אזורי תוכן"
    >
      {ITEMS.filter((t) => t.id !== "guide" || guideVisible).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
            active === item.id
              ? "bg-accent text-white shadow-sm"
              : "text-text-secondary hover:bg-surface hover:text-text-primary",
          )}
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
