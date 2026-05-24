"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { SECTION_PRO_TIPS, type AppSectionId } from "@/lib/navigation/sections";
import { cn } from "@/lib/cn";

export interface SectionPanelProps {
  id: string;
  sectionId: AppSectionId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** Start with body collapsed */
  defaultCollapsed?: boolean;
  /** Hide entire section from layout (sidebar can still show dimmed) */
  hidden?: boolean;
}

export function SectionPanel({
  id,
  sectionId,
  title,
  subtitle,
  children,
  className,
  defaultCollapsed = false,
  hidden = false,
}: SectionPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [proTipsOpen, setProTipsOpen] = useState(false);
  const tips = SECTION_PRO_TIPS[sectionId] ?? [];

  if (hidden) return null;

  return (
    <section
      id={id}
      className={cn(
        "section-panel scroll-mt-24",
        "rounded-2xl border border-stone-200/90 bg-white shadow-lg shadow-stone-300/20",
        "transition-shadow duration-300 hover:shadow-xl hover:shadow-stone-300/25",
        className,
      )}
      aria-labelledby={`${id}-title`}
    >
      <header className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0 flex-1">
          <h2
            id={`${id}-title`}
            className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {tips.length > 0 && (
            <button
              type="button"
              onClick={() => setProTipsOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                proTipsOpen
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-200",
              )}
              aria-expanded={proTipsOpen}
            >
              <LightBulbIcon className="h-4 w-4" aria-hidden />
              טיפים
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
            aria-expanded={!collapsed}
            aria-controls={`${id}-body`}
          >
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "-rotate-90",
              )}
              aria-hidden
            />
            {collapsed ? "הצג" : "הסתר"}
          </button>
        </div>
      </header>

      {proTipsOpen && tips.length > 0 && (
        <div className="border-b border-amber-100 bg-amber-50/80 px-5 py-4 sm:px-6">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
            <InformationCircleIcon className="h-4 w-4" aria-hidden />
            טיפי אפייה
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-amber-950/90">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-amber-600" aria-hidden>
                  •
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        id={`${id}-body`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="section-panel-body p-5 sm:p-6 md:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
