"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalculatorIcon } from "@heroicons/react/24/outline";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { Button } from "@/components/ui/Button";
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
    <div className="dashboard-shell flex min-h-screen min-w-0 max-w-[100vw] flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <AppBrandHeader
            tagline={heContent.app.brandSubtitle}
            logoSize={44}
          />
        </div>
      </header>

      <StickyMetricsBar form={form} />

      <div className="mx-auto w-full min-w-0 max-w-[90rem] flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
          <aside
            className={cn(
              "@container/sidebar hidden min-w-0 shrink-0 lg:block",
              "lg:min-w-[320px] lg:max-w-[400px] lg:w-[22rem] xl:w-[28rem]",
              "lg:sticky lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.75rem)]",
              "lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h)-1.5rem)]",
              "lg:overflow-y-auto lg:overscroll-contain",
              "rounded-2xl border border-warm-border/80 bg-white/80 p-4 shadow-md shadow-crust/5 backdrop-blur-md",
              "xl:p-5 2xl:p-6",
              "scrollbar-thin",
            )}
            aria-label="פרמטרי מתכון"
          >
            <p className="mb-4 font-serif text-base font-semibold text-charcoal xl:mb-5">
              התאמת מתכון
            </p>
            <RecipeInputsPanel form={form} surface="sidebar" />
          </aside>

          <div className="min-w-0 flex-1 lg:min-w-[min(100%,28rem)]">
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
        <RecipeInputsPanel form={form} surface="sheet" compact />
      </Sheet>

      <MobileBottomNav
        active={sheetOpen ? "inputs" : mobileTab}
        onSelect={handleMobileTab}
        guideVisible={!!guide}
      />

      {!sheetOpen && (
        <div
          className={cn(
            "fixed inset-x-0 z-40 border-t border-stone-200/90 bg-white/95 px-3 py-2.5 backdrop-blur-md",
            "bottom-[calc(var(--shell-nav-h)+env(safe-area-inset-bottom,0px))]",
            "lg:hidden",
          )}
        >
          <Button
            variant="primary"
            fullWidth
            className="min-h-11 shadow-lg shadow-amber-900/15"
            onClick={() => form.handleCalculate()}
          >
            <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {heContent.inputs.actions.calculate}
          </Button>
        </div>
      )}
    </div>
  );
}
