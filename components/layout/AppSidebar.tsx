"use client";

import {
  ChevronLeftIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NAV_GROUPS, type AppSectionId } from "@/lib/navigation/sections";
import type { LayoutState } from "@/hooks/useLayoutState";
import { cn } from "@/lib/cn";

interface AppSidebarProps {
  layout: LayoutState;
  className?: string;
  mobile?: boolean;
}

export function AppSidebar({ layout, className, mobile }: AppSidebarProps) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    activeSection,
    groupsCollapsed,
    toggleGroup,
    scrollToSection,
    setMobileNavOpen,
  } = layout;

  const collapsed = mobile ? false : sidebarCollapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-stone-200/90 bg-white/95 backdrop-blur-md",
        mobile
          ? "border-s"
          : "border-s shadow-xl shadow-stone-300/15",
        collapsed ? "w-[4.25rem]" : "w-72",
        "transition-[width] duration-300 ease-out",
        className,
      )}
      aria-label="ניווט ראשי"
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-stone-100 px-3",
          collapsed ? "justify-center" : "justify-between gap-2",
        )}
      >
        {!collapsed && (
          <span className="truncate px-1 text-sm font-semibold text-stone-800">
            ניווט
          </span>
        )}
        <div className="flex items-center gap-1">
          {mobile && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100"
              onClick={() => setMobileNavOpen(false)}
              aria-label="סגור תפריט"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          {!mobile && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-600 transition hover:bg-stone-100"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={collapsed ? "הרחב תפריט" : "כווץ תפריט"}
            >
              <ChevronLeftIcon
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  collapsed && "rotate-180",
                )}
              />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const groupShut = groupsCollapsed[group.id];

          return (
            <div key={group.id} className="mb-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-start transition",
                  "hover:bg-stone-50",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? group.label : undefined}
                aria-expanded={!groupShut}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wheat-muted text-crust">
                  <GroupIcon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                      {group.label}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "h-4 w-4 shrink-0 text-stone-400 transition-transform",
                        groupShut && "-rotate-90",
                      )}
                    />
                  </>
                )}
              </button>

              {!groupShut && !collapsed && (
                <ul className="mt-1 space-y-0.5 pe-1 ps-11">
                  {group.items.map((item) => {
                    const active = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() =>
                            scrollToSection(item.anchor, item.id as AppSectionId)
                          }
                          className={cn(
                            "w-full rounded-xl px-3 py-2.5 text-start transition",
                            active
                              ? "bg-crust text-dough shadow-md shadow-crust/25"
                              : "text-charcoal-muted hover:bg-wheat-muted/40",
                          )}
                        >
                          <span className="block text-sm font-medium">
                            {item.label}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block text-xs leading-snug",
                              active ? "text-wheat-light" : "text-charcoal-muted",
                            )}
                          >
                            {item.description}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!groupShut && collapsed && (
                <ul className="mt-1 space-y-1">
                  {group.items.map((item) => {
                    const active = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          title={item.label}
                          onClick={() =>
                            scrollToSection(item.anchor, item.id as AppSectionId)
                          }
                          className={cn(
                            "mx-auto flex h-2 w-2 rounded-full transition",
                            active
                              ? "h-2.5 w-2.5 bg-crust ring-2 ring-wheat"
                              : "bg-warm-border hover:bg-wheat",
                          )}
                          aria-label={item.label}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
