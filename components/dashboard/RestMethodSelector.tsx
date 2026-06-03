"use client";

import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { heContent } from "@/lib/content";
import type { RestMethod } from "@/lib/restMethod";
import { cn } from "@/lib/cn";

const copy = heContent.inputs.restMethod;

interface RestMethodSelectorProps {
  value: RestMethod;
  onChange: (method: RestMethod) => void;
  className?: string;
}

export function RestMethodSelector({
  value,
  onChange,
  className,
}: RestMethodSelectorProps) {
  const options: {
    id: RestMethod;
    label: string;
    hint: string;
    tooltip: "autolyse" | "fermentolyse";
  }[] = [
    {
      id: "autolyse",
      label: copy.autolyse,
      hint: copy.autolyseHint,
      tooltip: "autolyse",
    },
    {
      id: "fermentolyse",
      label: copy.fermentolyse,
      hint: copy.fermentolyseHint,
      tooltip: "fermentolyse",
    },
  ];

  return (
    <fieldset
      className={cn(
        "rounded-xl border border-border-subtle bg-surface px-3 py-4 sm:px-4",
        className,
      )}
    >
      <legend className="mb-3 px-1 text-sm font-semibold text-text-primary">
        {copy.title}
      </legend>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label={copy.title}>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                "flex min-h-[44px] cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors",
                selected
                  ? "brand-choice-active"
                  : "brand-choice-idle",
              )}
            >
              <input
                type="radio"
                name="restMethod"
                className="mt-1 h-5 w-5 shrink-0 accent-accent"
                checked={selected}
                onChange={() => onChange(opt.id)}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-text-primary">
                    {opt.label}
                  </span>
                  <InfoTooltip term={opt.tooltip} hover />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                  {opt.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
