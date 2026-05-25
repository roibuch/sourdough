"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { MobileLuxuryTabs, type LuxuryMobileTab } from "@/components/dashboard/MobileLuxuryTabs";
import { FlourBalanceDialog } from "@/components/dashboard/FlourBalanceDialog";
import { RecipeInputsPanel } from "@/components/dashboard/RecipeInputsPanel";
import { ResultsHero } from "@/components/dashboard/ResultsHero";
import { WelcomeEmptyState } from "@/components/dashboard/WelcomeEmptyState";
import { Sheet } from "@/components/ui/Sheet";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { RecipeCalculateFlow } from "@/hooks/useRecipeCalculateFlow";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface DashboardShellProps {
  form: RecipeForm;
  calculateFlow: RecipeCalculateFlow;
  timeline: ReactNode;
  starterPanel: ReactNode;
  guide: ReactNode | null;
  resultsDetails: ReactNode;
}

export function DashboardShell({
  form,
  calculateFlow,
  timeline,
  starterPanel,
  guide,
  resultsDetails,
}: DashboardShellProps) {
  const { showResults } = form;
  const {
    requestCalculate,
    balanceOpen,
    setBalanceOpen,
    onBalanceConfirm,
    balancePcts,
  } = calculateFlow;
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<LuxuryMobileTab>("timeline");

  useEffect(() => {
    if (mobileTab === "guide" && !guide) {
      setMobileTab("timeline");
    }
  }, [mobileTab, guide]);

  const onPrimaryCta = () => {
    if (showResults) {
      setEditSheetOpen(true);
      return;
    }
    requestCalculate();
  };

  return (
    <div className="dashboard-shell flex min-h-screen min-w-0 max-w-[100vw] flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[100rem] items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
          <AppBrandHeader
            tagline={heContent.app.brandSubtitle}
            logoSize={40}
            className="text-text-primary"
          />
          {showResults && (
            <button
              type="button"
              className="touch-target hidden gap-2 text-sm text-text-secondary hover:text-accent-gold lg:inline-flex"
              onClick={() => setEditSheetOpen(true)}
            >
              <PencilSquareIcon className="h-5 w-5" aria-hidden />
              {heContent.luxury.editRecipe}
            </button>
          )}
        </div>
      </header>

      <div className="content-safe-bottom mx-auto flex w-full min-w-0 max-w-[100rem] flex-1 flex-col lg:flex-row">
        {/* Editor — RTL first = ימין, 40% desktop */}
        <aside
          className={cn(
            "luxury-panel min-w-0 shrink-0",
            "hidden lg:block lg:w-[40%] lg:max-w-md lg:border-e",
            "lg:sticky lg:top-[var(--shell-header-h)] lg:max-h-[calc(100vh-var(--shell-header-h))]",
            "lg:overflow-y-auto lg:overscroll-contain lg:p-6 xl:p-8",
            "scrollbar-thin",
          )}
          aria-label={heContent.luxury.editorTitle}
        >
          <p className="mb-6 font-serif text-lg font-normal tracking-wide text-text-primary">
            {heContent.luxury.editorTitle}
          </p>
          <RecipeInputsPanel
            form={form}
            calculateFlow={calculateFlow}
            surface="sidebar"
          />
        </aside>

        {/* Results / hero — 60% desktop */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="lg:hidden">
            {!showResults ? (
              <div className="border-b border-border-subtle px-4 py-6">
                <RecipeInputsPanel
                  form={form}
                  calculateFlow={calculateFlow}
                  surface="sheet"
                  compact
                />
              </div>
            ) : (
              <>
                <div className="min-h-[70vh]">
                  <ResultsHero form={form} />
                </div>
                <MobileLuxuryTabs
                  active={mobileTab}
                  onSelect={setMobileTab}
                  guideVisible={!!guide}
                />
                <div className="min-h-[12rem] px-4 py-6">
                  {mobileTab === "timeline" && timeline}
                  {mobileTab === "starter" && starterPanel}
                  {mobileTab === "guide" && guide}
                </div>
              </>
            )}
          </div>

          <div className="hidden min-h-[calc(100vh-var(--shell-header-h))] flex-col lg:flex">
            {showResults ? (
              <>
                <ResultsHero form={form} />
                <div className="border-t border-border-subtle px-6 py-8 xl:px-10">
                  {resultsDetails}
                </div>
              </>
            ) : (
              <WelcomeEmptyState />
            )}
          </div>
        </main>
      </div>

      <FlourBalanceDialog
        open={balanceOpen}
        pcts={balancePcts}
        onCancel={() => setBalanceOpen(false)}
        onConfirm={onBalanceConfirm}
      />

      <footer className="border-t border-border-subtle py-6 text-center text-xs text-text-muted">
        {heContent.app.footerShort}
      </footer>

      <Sheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        title={heContent.luxury.editRecipe}
      >
        <RecipeInputsPanel
          form={form}
          calculateFlow={calculateFlow}
          surface="sheet"
          compact
        />
      </Sheet>

      <div
        className={cn(
          "fixed inset-x-0 z-50 border-t border-border-subtle bg-surface/98 px-4 py-3 backdrop-blur-xl lg:hidden",
          "bottom-[env(safe-area-inset-bottom,0px)]",
        )}
      >
        <button type="button" className="cta-gold rounded-sm" onClick={onPrimaryCta}>
          {showResults
            ? heContent.luxury.editRecipe
            : heContent.inputs.actions.calculate}
        </button>
      </div>
    </div>
  );
}
