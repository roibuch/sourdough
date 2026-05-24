"use client";

import { useState, type ReactNode } from "react";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { MobileBottomNav, type MobileTab } from "@/components/dashboard/MobileBottomNav";
import { RecipeInputsPanel } from "@/components/dashboard/RecipeInputsPanel";
import { Sheet } from "@/components/ui/Sheet";
import { StickyMetricsBar } from "@/components/dashboard/StickyMetricsBar";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface DashboardShellProps {
  form: RecipeForm;
  outputs: ReactNode;
  guide: ReactNode | null;
  reference: ReactNode;
}

export function DashboardShell({
  form,
  outputs,
  guide,
  reference,
}: DashboardShellProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("outputs");
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleMobileTab = (tab: MobileTab) => {
    if (tab === "inputs") {
      setSheetOpen(true);
      return;
    }
    setMobileTab(tab);
    setSheetOpen(false);
  };

  return (
    <div className="dashboard-shell flex min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-30 border-b border-warm-border/70 bg-dough/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <AppBrandHeader
            tagline="מחשבון בצק, לוח אפייה ומדריך"
            logoSize={44}
          />
        </div>
      </header>

      <StickyMetricsBar form={form} />

      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col lg:flex-row">
        <aside
          className={cn(
            "hidden min-w-0 shrink-0 border-warm-border/70 lg:block lg:w-[min(100%,22rem)] xl:w-96",
            "lg:sticky lg:self-start lg:border-e",
            "lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h))]",
            "lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h))]",
            "lg:overflow-y-auto lg:overscroll-contain",
            "lg:px-4 lg:py-6",
          )}
          aria-label="פרמטרי מתכון"
        >
          <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-charcoal-muted">
            התאמת מתכון
          </p>
          <RecipeInputsPanel form={form} />
        </aside>

        <main
          id="main"
          className={cn(
            "min-w-0 flex-1 overflow-x-clip",
            "px-3 py-4 sm:px-6 sm:py-6",
            "content-safe-bottom",
          )}
        >
          <div className="lg:hidden">
            {mobileTab === "outputs" && (
              <div className="space-y-4 sm:space-y-6">{outputs}</div>
            )}
            {mobileTab === "guide" && guide && (
              <div className="space-y-4 sm:space-y-6">{guide}</div>
            )}
            {mobileTab === "reference" && (
              <div className="space-y-4 sm:space-y-6">{reference}</div>
            )}
          </div>

          <div className="hidden min-w-0 space-y-8 lg:block">{outputs}</div>
          {guide && <div className="mt-8 hidden min-w-0 lg:block">{guide}</div>}
          <div className="mt-8 hidden min-w-0 lg:block">{reference}</div>

          <footer className="mt-8 border-t border-warm-border/70 pt-5 text-center text-xs text-charcoal-muted sm:mt-12 sm:pt-6">
            {heContent.app.footerShort}
          </footer>
        </main>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="התאמת פרמטרים"
      >
        <RecipeInputsPanel form={form} compact />
      </Sheet>

      <MobileBottomNav
        active={sheetOpen ? "inputs" : mobileTab}
        onSelect={handleMobileTab}
        guideVisible={!!guide}
      />
    </div>
  );
}
