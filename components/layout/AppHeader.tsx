"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { APP_TAGLINE } from "@/lib/navigation/sections";
import type { LayoutState } from "@/hooks/useLayoutState";

interface AppHeaderProps {
  layout: LayoutState;
}

export function AppHeader({ layout }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-warm-border/80 bg-dough/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-warm-border bg-white text-charcoal-muted shadow-sm transition hover:bg-wheat-muted/50 lg:hidden"
          onClick={() => layout.setMobileNavOpen(true)}
          aria-label="פתח תפריט ניווט"
        >
          <Bars3Icon className="h-6 w-6" strokeWidth={1.75} />
        </button>

        <AppBrandHeader tagline={APP_TAGLINE} logoSize={48} />
      </div>
    </header>
  );
}
