"use client";

import { useId, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";
import { cn } from "@/lib/cn";

interface InfoTooltipProps {
  term: GlossaryTerm;
  className?: string;
}

export function InfoTooltip({ term, className }: InfoTooltipProps) {
  const entry = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
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
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 lg:hidden"
            aria-label="סגור הסבר"
            onClick={() => setOpen(false)}
          />
          <span
            id={tooltipId}
            role="tooltip"
            className={cn(
              "z-50 w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-stone-200/90",
              "bg-white/95 px-3 py-2.5 text-start text-xs leading-relaxed text-slate-800 shadow-xl backdrop-blur-md",
              "fixed bottom-24 start-4 end-4 lg:absolute lg:bottom-auto lg:start-auto lg:end-0 lg:top-full lg:mt-2",
            )}
          >
            <strong className="block font-semibold text-charcoal">
              {entry.label}
            </strong>
            <span className="mt-1 block text-stone-600">{entry.detail}</span>
          </span>
        </>
      )}
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
