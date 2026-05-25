"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

interface AccordionContextValue {
  type: "single" | "multiple";
  open: string[];
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function Accordion({
  type = "single",
  defaultValue = [],
  value: controlledValue,
  onValueChange,
  className,
  children,
}: {
  type?: "single" | "multiple";
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  children: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState<string[]>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const open = isControlled ? controlledValue : uncontrolledOpen;

  const toggle = useCallback(
    (id: string) => {
      const prev = open;
      const isOpen = prev.includes(id);
      const next =
        type === "single"
          ? isOpen
            ? []
            : [id]
          : isOpen
            ? prev.filter((x) => x !== id)
            : [...prev, id];
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange, open, type],
  );

  return (
    <AccordionContext.Provider value={{ type, open, toggle }}>
      <div className={cn("space-y-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id,
  title,
  subtitle,
  icon,
  badge,
  children,
  className,
  contentClassName,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const ctx = useContext(AccordionContext);
  const panelId = useId();
  const isOpen = ctx?.open.includes(id) ?? false;

  if (!ctx) {
    throw new Error("AccordionItem must be used within Accordion");
  }

  return (
    <div className={cn("app-card overflow-hidden", className)}>
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${panelId}-panel`}
        onClick={() => ctx.toggle(id)}
        className="flex min-h-[48px] w-full items-center gap-3 px-4 py-3.5 text-start hover:bg-stone-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 text-start">
          <span className="block text-base font-semibold text-text-primary">
            {title}
          </span>
          {subtitle ? (
            <span className="mt-0.5 line-clamp-2 block text-xs text-text-muted">
              {subtitle}
            </span>
          ) : null}
        </span>
        {badge}
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 shrink-0 text-text-muted transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        id={`${panelId}-panel`}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        aria-hidden={!isOpen}
        className={cn(
          "grid min-w-0 transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] overflow-hidden",
          !isOpen && "pointer-events-none",
        )}
      >
        <div className="min-h-0 min-w-0">
          <div
            className={cn(
              "min-w-0 max-w-full border-t border-border-subtle px-3 pb-5 pt-4 sm:px-4",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
