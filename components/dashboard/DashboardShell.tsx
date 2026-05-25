"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalculatorIcon } from "@heroicons/react/24/outline";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import {
  DesktopViewTabs,
  type DesktopMainTab,
} from "@/components/dashboard/DesktopViewTabs";
import { MobileBottomNav, type MobileTab } from "@/components/dashboard/MobileBottomNav";
import { FlourBalanceDialog } from "@/components/dashboard/FlourBalanceDialog";
import { RecipeInputsPanel } from "@/components/dashboard/RecipeInputsPanel";
import { Sheet } from "@/components/ui/Sheet";
import { StickyMetricsBar } from "@/components/dashboard/StickyMetricsBar";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { RecipeCalculateFlow } from "@/hooks/useRecipeCalculateFlow";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface DashboardShellProps {
  form: RecipeForm;
  calculateFlow: RecipeCalculateFlow;
  outputs: ReactNode;
  guide: ReactNode | null;
  reference: ReactNode;
}

export function DashboardShell({
  form,
  calculateFlow,
  outputs,
  guide,
  reference,
}: DashboardShellProps) {
  const {
    requestCalculate,
    balanceOpen,
    setBalanceOpen,
    onBalanceConfirm,
    balancePcts,
  } = calculateFlow;

  const { showResults } = form;
  const [mobileTab, setMobileTab] = useState<MobileTab>("outputs");
  const [desktopTab, setDesktopTab] = useState<DesktopMainTab>("outputs");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (showResults) {
      setMobileTab("outputs");
      setDesktopTab("outputs");
    }
  }, [showResults]);

  useEffect(() => {
    if (desktopTab === "guide" && !guide) {
      setDesktopTab("outputs");
    }
  }, [desktopTab, guide]);

  useEffect(() => {
    if (mobileTab === "guide" && !guide) {
      setMobileTab("outputs");
    }
  }, [mobileTab, guide]);

  const handleMobileTab = (tab: MobileTab) => {
    if (tab === "inputs") {
      setSheetOpen(true);
      return;
    }
    setMobileTab(tab);
    setSheetOpen(false);
  };

  return (
    <div className="dashboard-shell flex min-h-screen min-w-0 max-w-[100vw] flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <AppBrandHeader
            tagline={heContent.app.brandSubtitle}
            logoSize={44}
          />
        </div>
      </header>

      <StickyMetricsBar form={form} />

      <div className="content-safe-bottom mx-auto w-full min-w-0 max-w-[90rem] flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
          <aside
            className={cn(
              "@container/sidebar hidden min-w-0 shrink-0 lg:block",
              "lg:min-w-[320px] lg:w-80 lg:max-w-[24rem] xl:w-96",
              "lg:sticky lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.75rem)]",
              "lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h)-1.5rem)]",
              "lg:overflow-y-auto lg:overscroll-contain",
              "app-card p-4 xl:p-5 2xl:p-6",
              "scrollbar-thin",
            )}
            aria-label="פרמטרי מתכון"
          >
            <p className="mb-4 font-serif text-base font-medium text-text-primary xl:mb-5">
              {heContent.luxury.editorTitle}
            </p>
            <RecipeInputsPanel
              form={form}
              calculateFlow={calculateFlow}
              surface="sidebar"
            />
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

        <footer className="mt-10 border-t border-border-subtle pt-6 text-center text-xs text-text-muted">
          {heContent.app.footerShort}
        </footer>
      </div>

      <FlourBalanceDialog
        open={balanceOpen}
        pcts={balancePcts}
        onCancel={() => setBalanceOpen(false)}
        onConfirm={onBalanceConfirm}
      />

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={heContent.luxury.editRecipe}
      >
        <RecipeInputsPanel
          form={form}
          calculateFlow={calculateFlow}
          surface="sheet"
          compact
        />
      </Sheet>

      <MobileBottomNav
        active={sheetOpen ? "inputs" : mobileTab}
        onSelect={handleMobileTab}
        guideVisible={!!guide}
      />

      {!sheetOpen && (
        <div
          className={cn(
            "fixed inset-x-0 z-40 border-t border-border-subtle bg-surface px-3 py-2.5 shadow-[0_-4px_20px_rgb(28_25_23/0.08)] backdrop-blur-md",
            "bottom-[calc(var(--shell-nav-h)+env(safe-area-inset-bottom,0px))]",
            "lg:hidden",
          )}
        >
          <button
            type="button"
            className="cta-primary flex items-center justify-center gap-2"
            onClick={() => requestCalculate()}
          >
            <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {heContent.inputs.actions.calculate}
          </button>
        </div>
      )}
    </div>
  );
}
