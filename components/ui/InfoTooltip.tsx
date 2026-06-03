"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";
import { cn } from "@/lib/cn";

interface InfoTooltipProps {
  term: GlossaryTerm;
  className?: string;
  /** Desktop: show on hover; mobile still uses tap */
  hover?: boolean;
}

function readShellInset(): { bottom: number; top: number } {
  if (typeof window === "undefined") return { bottom: 16, top: 16 };
  const shell = document.querySelector(".dashboard-shell");
  const style = getComputedStyle(shell ?? document.documentElement);
  const nav = parseFloat(style.getPropertyValue("--shell-nav-h")) || 0;
  const cta = parseFloat(style.getPropertyValue("--shell-sticky-cta-h")) || 0;
  const safe = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "env(safe-area-inset-bottom)",
    ),
  ) || 0;
  return { bottom: nav + cta + safe + 12, top: 12 };
}

function placeTooltip(anchor: DOMRect, tooltipHeight: number) {
  const margin = 12;
  const width = Math.min(272, window.innerWidth - margin * 2);
  const { bottom: bottomInset, top: topInset } = readShellInset();

  let left = anchor.right - width;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

  let top = anchor.bottom + 8;
  if (top + tooltipHeight > window.innerHeight - bottomInset) {
    top = anchor.top - tooltipHeight - 8;
  }
  top = Math.max(topInset, top);

  return { top, left, width };
}

export function InfoTooltip({
  term,
  className,
  hover = false,
}: InfoTooltipProps) {
  const entry = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 272 });
  const tooltipId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;

    const update = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const height = panelRef.current?.offsetHeight ?? 96;
      setCoords(placeTooltip(rect, height));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !panelRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords(placeTooltip(rect, panelRef.current.offsetHeight));
  }, [open, entry.detail]);

  const close = () => setOpen(false);

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80] cursor-default bg-stone-900/20 lg:bg-transparent"
              aria-label="סגור הסבר"
              onClick={close}
            />
            <span
              ref={panelRef}
              id={tooltipId}
              role="tooltip"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
              className={cn(
                "fixed z-[90] rounded-xl border border-stone-200/90",
                "bg-white px-3 py-2.5 text-start text-xs leading-relaxed text-slate-800 shadow-xl",
              )}
            >
              <strong className="block font-semibold text-charcoal">
                {entry.label}
              </strong>
              <span className="mt-1 block text-stone-600">{entry.detail}</span>
            </span>
          </>,
          document.body,
        )
      : null;

  return (
    <span
      className={cn("relative inline-flex align-middle", className)}
      onMouseEnter={hover ? () => setOpen(true) : undefined}
      onMouseLeave={hover ? () => setOpen(false) : undefined}
    >
      <button
        ref={btnRef}
        type="button"
        className={cn(
          "touch-target -my-1 inline-flex shrink-0 rounded-full",
          "text-amber-800/80 transition hover:bg-amber-100 hover:text-amber-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1",
          open && "bg-amber-100 text-amber-950",
        )}
        aria-label={`הסבר: ${entry.label}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <InformationCircleIcon className="h-4 w-4" strokeWidth={2} />
      </button>
      {panel}
    </span>
  );
}

export function FieldLabelWithTip({
  term,
  htmlFor,
  children,
}: {
  term: GlossaryTerm;
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  const entry = GLOSSARY[term];
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
        {children ?? entry.label}
      </label>
      <InfoTooltip term={term} />
    </div>
  );
}
