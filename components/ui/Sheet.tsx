"use client";

import { useEffect, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Sticky footer (e.g. confirm / cancel) */
  footer?: ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        aria-label="סגור"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[min(88dvh,720px)] flex-col rounded-t-2xl bg-surface shadow-[var(--shadow-elevated)]",
          "pb-[env(safe-area-inset-bottom)]",
          "motion-safe:animate-[sheet-up_0.35s_cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-stone-300" />
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <h2
            id="sheet-title"
            className="font-serif text-lg font-medium text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="touch-target rounded-xl text-text-muted hover:bg-stone-100 hover:text-text-primary"
            aria-label="סגור פאנל"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-border-subtle bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
