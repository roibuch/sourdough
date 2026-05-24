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

  const setOpen = useCallback(
    (next: string[] | ((prev: string[]) => string[])) => {
      const apply = (prev: string[]) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        if (!isControlled) {
          setUncontrolledOpen(resolved);
        }
        onValueChange?.(resolved);
        return resolved;
      };
      if (isControlled) {
        apply(open);
      } else {
        setUncontrolledOpen(apply);
      }
    },
    [isControlled, onValueChange, open],
  );

  const toggle = useCallback(
    (id: string) => {
      setOpen((prev) => {
        const isOpen = prev.includes(id);
        if (type === "single") {
          return isOpen ? [] : [id];
        }
        return isOpen ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [setOpen, type],
  );

  return (
    <AccordionContext.Provider value={{ type, open, toggle }}>
      <div className={cn("space-y-2", className)}>{children}</div>
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
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-warm-border/80 bg-white/70 shadow-sm backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${panelId}-panel`}
        onClick={() => ctx.toggle(id)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition hover:bg-wheat-muted/50"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wheat-muted text-crust">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-charcoal">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs font-normal text-stone-500">
              {subtitle}
            </span>
          ) : null}
        </span>
        {badge}
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 shrink-0 text-stone-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        id={`${panelId}-panel`}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        hidden={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-stone-100 px-4 pb-4 pt-3",
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
