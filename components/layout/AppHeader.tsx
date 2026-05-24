"use client";

import { Bars3Icon, SparklesIcon } from "@heroicons/react/24/outline";
import { APP_TAGLINE } from "@/lib/navigation/sections";
import type { LayoutState } from "@/hooks/useLayoutState";

interface AppHeaderProps {
  layout: LayoutState;
}

export function AppHeader({ layout }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-cream/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:bg-stone-50 lg:hidden"
          onClick={() => layout.setMobileNavOpen(true)}
          aria-label="פתח תפריט ניווט"
        >
          <Bars3Icon className="h-6 w-6" strokeWidth={1.75} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80 sm:flex"
            aria-hidden
          >
            <SparklesIcon className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg font-semibold text-stone-900 sm:text-xl">
              Sourdough Master
            </h1>
            <p className="hidden truncate text-xs text-stone-500 sm:block">
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
