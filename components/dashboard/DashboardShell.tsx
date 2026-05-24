"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import {
  DesktopViewTabs,
  type DesktopMainTab,
} from "@/components/dashboard/DesktopViewTabs";
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
  const [desktopTab, setDesktopTab] = useState<DesktopMainTab>("outputs");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (desktopTab === "guide" && !guide) {
      setDesktopTab("outputs");
    }
  }, [desktopTab, guide]);

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

      <div className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside
            className={cn(
              "hidden min-w-0 shrink-0 lg:block lg:w-72 xl:w-80",
              "lg:sticky lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.75rem)]",
              "lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h)-1.5rem)]",
              "lg:overflow-y-auto lg:overscroll-contain",
              "rounded-2xl border border-warm-border/80 bg-white/70 p-4 shadow-sm backdrop-blur-md",
              "scrollbar-thin",
            )}
            aria-label="פרמטרי מתכון"
          >
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-charcoal-muted">
              התאמת מתכון
            </p>
            <RecipeInputsPanel form={form} />
          </aside>

          <div className="min-w-0 flex-1">
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

            <div className="hidden lg:block">
              <DesktopViewTabs
                active={desktopTab}
                onSelect={setDesktopTab}
                guideVisible={!!guide}
              />
              <div className="space-y-6">
                {desktopTab === "outputs" && outputs}
                {desktopTab === "guide" && guide}
                {desktopTab === "reference" && reference}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 border-t border-warm-border/70 pt-6 text-center text-xs text-charcoal-muted">
          {heContent.app.footerShort}
        </footer>
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
