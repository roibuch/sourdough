"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalculatorIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { AppSegmentNav, type AppSegment } from "@/components/dashboard/AppSegmentNav";
import { FlourBalanceDialog } from "@/components/dashboard/FlourBalanceDialog";
import { RecipeInputsPanel } from "@/components/dashboard/RecipeInputsPanel";
import { Sheet } from "@/components/ui/Sheet";
import { StickyMetricsBar } from "@/components/dashboard/StickyMetricsBar";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { RecipeCalculateFlow } from "@/hooks/useRecipeCalculateFlow";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

export interface DashboardSections {
  empty: ReactNode;
  hero: ReactNode;
  recipe: ReactNode;
  timeline: ReactNode;
  starter: ReactNode;
  guide: ReactNode | null;
  reference: ReactNode;
  warnings?: ReactNode;
}

interface DashboardShellProps {
  form: RecipeForm;
  calculateFlow: RecipeCalculateFlow;
  sections: DashboardSections;
}

export function DashboardShell({
  form,
  calculateFlow,
  sections,
}: DashboardShellProps) {
  const { showResults } = form;
  const {
    requestCalculate,
    balanceOpen,
    setBalanceOpen,
    onBalanceConfirm,
    balancePcts,
  } = calculateFlow;

  const [segment, setSegment] = useState<AppSegment>("recipe");
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  useEffect(() => {
    if (showResults) {
      setSegment("recipe");
    }
  }, [showResults]);

  useEffect(() => {
    if (segment === "guide" && !sections.guide) {
      setSegment("recipe");
    }
  }, [segment, sections.guide]);

  const segmentPanel = (() => {
    if (!showResults) return null;
    switch (segment) {
      case "recipe":
        return sections.recipe;
      case "timeline":
        return sections.timeline;
      case "starter":
        return sections.starter;
      case "guide":
        return sections.guide;
      case "reference":
        return sections.reference;
      default:
        return null;
    }
  })();

  return (
    <div className="dashboard-shell flex min-h-screen min-w-0 max-w-[100vw] flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[100rem] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <AppBrandHeader tagline={heContent.app.brandSubtitle} logoSize={40} />
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

      <StickyMetricsBar form={form} />

      <div className="content-safe-bottom mx-auto flex w-full min-w-0 max-w-[100rem] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:py-6">
        {/* עורך — RTL ראשון = ימין */}
        <aside
          className={cn(
            "order-1 w-full min-w-0 shrink-0 overflow-x-hidden lg:order-none",
            "lg:w-[26rem] lg:max-w-[42%] xl:w-[28rem]",
            "lg:sticky lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h)+1rem)]",
            "lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h)-2rem)]",
            "lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain scrollbar-thin",
          )}
          aria-label={heContent.luxury.editorTitle}
        >
          <div className="app-card max-w-full overflow-x-clip p-4 ps-5 pe-4 sm:p-5">
            <h2 className="mb-4 font-serif text-lg font-medium text-text-primary">
              {heContent.luxury.editorTitle}
            </h2>
            <RecipeInputsPanel
              form={form}
              calculateFlow={calculateFlow}
              surface="sidebar"
            />
            <div className="mt-4 hidden lg:block">
              <button
                type="button"
                className="cta-primary flex items-center justify-center gap-2"
                onClick={() => requestCalculate()}
              >
                <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                {heContent.inputs.actions.calculate}
              </button>
            </div>
          </div>
        </aside>

        {/* תוצאות ותוכן — שמאל */}
        <main className="order-2 min-w-0 flex-1 lg:order-none">
          {sections.warnings}

          {!showResults ? (
            sections.empty
          ) : (
            <div className="space-y-5">
              {sections.hero}
              <AppSegmentNav
                active={segment}
                onSelect={setSegment}
                guideVisible={!!sections.guide}
              />
              <div className="min-w-0 space-y-4">{segmentPanel}</div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border-subtle py-5 text-center text-xs text-text-muted">
        {heContent.app.footerShort}
      </footer>

      <FlourBalanceDialog
        open={balanceOpen}
        pcts={balancePcts}
        onCancel={() => setBalanceOpen(false)}
        onConfirm={onBalanceConfirm}
      />

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
          "fixed inset-x-0 z-40 flex flex-col gap-2 border-t border-border-subtle bg-surface/98 px-4 py-2.5 backdrop-blur-md lg:hidden",
          "bottom-[env(safe-area-inset-bottom,0px)]",
        )}
      >
        {showResults && (
          <AppSegmentNav
            active={segment}
            onSelect={setSegment}
            guideVisible={!!sections.guide}
            className="shadow-sm"
          />
        )}
        <button
          type="button"
          className="cta-primary flex items-center justify-center gap-2"
          onClick={() => {
            if (showResults) {
              setEditSheetOpen(true);
              return;
            }
            requestCalculate();
          }}
        >
          {showResults ? (
            <>
              <PencilSquareIcon className="h-5 w-5" aria-hidden />
              {heContent.luxury.editRecipe}
            </>
          ) : (
            <>
              <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              {heContent.inputs.actions.calculate}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
