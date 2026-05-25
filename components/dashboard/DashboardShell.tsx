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
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:max-w-[100rem] lg:px-8">
          <AppBrandHeader
            tagline={heContent.app.brandSubtitle}
            logoSize={40}
          />
          {showResults && (
            <button
              type="button"
              className="touch-target hidden items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 text-sm font-medium text-text-secondary shadow-sm hover:border-accent/30 hover:text-accent lg:inline-flex"
              onClick={() => setEditSheetOpen(true)}
            >
              <PencilSquareIcon className="h-5 w-5" aria-hidden />
              {heContent.luxury.editRecipe}
            </button>
          )}
        </div>
      </header>

      <div className="content-safe-bottom mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col lg:max-w-[100rem] lg:flex-row lg:gap-6 lg:px-6 lg:pt-6">
        <aside
          className={cn(
            "hidden min-w-0 shrink-0 lg:block lg:w-[min(22rem,38%)] lg:max-w-md",
            "lg:sticky lg:top-[calc(var(--shell-header-h)+1.5rem)] lg:max-h-[calc(100vh-var(--shell-header-h)-3rem)]",
            "lg:overflow-y-auto lg:overscroll-contain scrollbar-thin",
          )}
          aria-label={heContent.luxury.editorTitle}
        >
          <div className="app-card p-6 xl:p-7">
            <h2 className="mb-5 font-serif text-xl font-medium text-text-primary">
              {heContent.luxury.editorTitle}
            </h2>
            <RecipeInputsPanel
              form={form}
              calculateFlow={calculateFlow}
              surface="sidebar"
            />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="lg:hidden">
            {!showResults ? (
              <div className="px-4 py-5">
                <div className="app-card p-4">
                  <RecipeInputsPanel
                    form={form}
                    calculateFlow={calculateFlow}
                    surface="sheet"
                    compact
                  />
                </div>
              </div>
            ) : (
              <>
                <ResultsHero form={form} />
                <MobileLuxuryTabs
                  active={mobileTab}
                  onSelect={setMobileTab}
                  guideVisible={!!guide}
                />
                <div className="space-y-4 px-4 py-5">
                  {mobileTab === "timeline" && timeline}
                  {mobileTab === "starter" && starterPanel}
                  {mobileTab === "guide" && guide}
                </div>
              </>
            )}
          </div>

          <div className="hidden flex-col lg:flex">
            {showResults ? (
              <>
                <ResultsHero form={form} />
                <div className="px-2 pb-10">{resultsDetails}</div>
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

      <footer className="border-t border-border-subtle py-5 text-center text-xs text-text-muted">
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
          "fixed inset-x-0 z-50 border-t border-border-subtle bg-surface px-4 py-3 shadow-[0_-4px_20px_rgb(28_25_23/0.08)] lg:hidden",
          "bottom-[env(safe-area-inset-bottom,0px)]",
        )}
      >
        <button type="button" className="cta-primary" onClick={onPrimaryCta}>
          {showResults
            ? heContent.luxury.editRecipe
            : heContent.inputs.actions.calculate}
        </button>
      </div>
    </div>
  );
}
