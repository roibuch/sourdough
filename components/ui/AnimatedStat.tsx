"use client";

import { useEffect, useRef, useState } from "react";
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
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 450);
      return () => window.clearTimeout(t);
    }
  }, [value]);

  return (
    <StatHighlight
      label={label}
      value={value}
      sublabel={sublabel}
      featured={featured}
      className={cn(
        className,
        "transition-all duration-300",
        pulse && "animate-stat-pulse scale-[1.02]",
      )}
    />
  );
}
