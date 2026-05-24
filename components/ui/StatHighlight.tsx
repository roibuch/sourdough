import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatHighlightProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  featured?: boolean;
  className?: string;
}

export function StatHighlight({
  label,
  value,
  sublabel,
  featured,
  className,
}: StatHighlightProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-center sm:p-5",
        featured
          ? "border-wheat bg-gradient-to-br from-wheat-muted to-white shadow-md shadow-crust/10 ring-2 ring-wheat/40"
          : "border-warm-border/80 bg-white/70 backdrop-blur-sm",
        className,
      )}
    >
      <span className="block text-xs font-medium uppercase tracking-wide text-charcoal-muted">
        {label}
      </span>
      <strong
        className={cn(
          "mt-2 block font-serif leading-none text-charcoal",
          featured ? "text-3xl sm:text-4xl" : "text-xl",
        )}
      >
        {value}
      </strong>
      {sublabel && (
        <span className="mt-1.5 block text-xs text-charcoal-muted">{sublabel}</span>
      )}
    </div>
  );
}
