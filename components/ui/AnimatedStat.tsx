"use client";

import { MorphingValue } from "@/components/motion/MorphingValue";
import { StatHighlight } from "@/components/ui/StatHighlight";
import { cn } from "@/lib/cn";

interface AnimatedStatProps {
  label: string;
  value: string;
  sublabel?: string;
  featured?: boolean;
  className?: string;
}

export function AnimatedStat({
  label,
  value,
  sublabel,
  featured,
  className,
}: AnimatedStatProps) {
  return (
    <StatHighlight
      label={label}
      value={
        <MorphingValue
          value={value}
          emphasize={featured}
          className={cn(
            featured ? "text-3xl sm:text-4xl" : "text-xl",
            "font-serif font-semibold leading-none text-charcoal",
          )}
        />
      }
      sublabel={sublabel}
      featured={featured}
      className={className}
    />
  );
}
