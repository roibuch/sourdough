"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface CountUpValueProps {
  value: number;
  durationMs?: number;
  className?: string;
  decimals?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CountUpValue({
  value,
  durationMs = 800,
  className,
  decimals = 0,
}: CountUpValueProps) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    if (started.current) {
      setDisplay(value);
      return;
    }
    started.current = true;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : String(Math.round(display));

  return (
    <span className={cn("tabular-nums", className)} aria-live="polite">
      {formatted}
    </span>
  );
}
