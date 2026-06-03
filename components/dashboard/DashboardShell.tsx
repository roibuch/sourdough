"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CalculatorIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { AppSegmentNav, type AppSegment } from "@/components/dashboard/AppSegmentNav";
import { FlourBalanceDialog } from "@/components/dashboard/FlourBalanceDialog";
import { MobileAppHeader } from "@/components/dashboard/MobileAppHeader";
import {
  MobileShellBottom,
} from "@/components/dashboard/MobileShellBottom";
import type { MobileTab } from "@/components/dashboard/MobileBottomNav";
import { RecipeInputsPanel } from "@/components/dashboard/RecipeInputsPanel";
import { RecipeNavProvider } from "@/components/dashboard/RecipeNavContext";
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
  const { showResults, showGuide } = form;
  const {
    requestCalculate,
    balanceOpen,
    setBalanceOpen,
    onBalanceConfirm,
    balancePcts,
  } = calculateFlow;

  const [segment, setSegment] = useState<AppSegment>("recipe");
  const [mobileTab, setMobileTab] = useState<MobileTab>("inputs");
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showResults && showGuide) {
      setSegment("guide");
      setMobileTab("guide");
    } else if (showResults) {
      setSegment("recipe");
      setMobileTab("outputs");
    }
  }, [showResults, showGuide]);

  useEffect(() => {
    if (segment === "guide" && !sections.guide) {
      setSegment("recipe");
    }
  }, [segment, sections.guide]);

  const handleApplyEdit = () => {
    if (requestCalculate()) {
      setEditSheetOpen(false);
    }
  };

  const navigateToGuide = useCallback(() => {
    setSegment("guide");
    setMobileTab("guide");
    requestAnimationFrame(() => {
      document.getElementById("section-guide")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const starterOnlyView = showGuide && !showResults && !!sections.guide;

  const editSheetFooter = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        className="min-h-[44px] rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
        onClick={() => setEditSheetOpen(false)}
      >
        {heContent.luxury.cancelEdit}
      </button>
      <button
        type="button"
        className="cta-primary flex min-h-[44px] items-center justify-center gap-2 disabled:opacity-50"
        disabled={!calculateFlow.validation.canCalculate}
        onClick={handleApplyEdit}
      >
        <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {heContent.luxury.applyRecipe}
      </button>
    </div>
  );

  const segmentPanel = (() => {
    if (!showResults) return null;
    switch (segment) {
      case "recipe":
        return sections.recipe;
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

  const mobilePanel = (() => {
    switch (mobileTab) {
      case "inputs":
        return (
          <div className="px-4 py-4">
            <h2 className="mb-3 font-serif text-lg font-medium text-text-primary">
              {heContent.luxury.editorTitle}
            </h2>
            <RecipeInputsPanel
              form={form}
              calculateFlow={calculateFlow}
              surface="default"
              hidePrimaryCta
            />
          </div>
        );
      case "outputs":
        if (!showResults) {
          return (
            <div className="px-4 py-6">
              {sections.empty}
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-dashed border-accent/40 bg-accent-muted/50 px-4 py-3 text-sm font-medium text-accent"
                onClick={() => setMobileTab("inputs")}
              >
                {heContent.luxury.mobileGoToInputs}
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-4 px-4 py-4">
            {sections.hero}
            {sections.recipe}
          </div>
        );
      case "guide":
        if (starterOnlyView) {
          return <div className="space-y-4 px-4 py-4">{sections.guide}</div>;
        }
        if (!showResults) {
          return (
            <div className="space-y-4 px-4 py-4">
              {sections.guide ?? (
                <p className="text-sm text-text-secondary">
                  {heContent.guide.starterOnly}
                </p>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-4 px-4 py-4">
            {sections.guide}
            {sections.starter}
          </div>
        );
      case "reference":
        return <div className="px-4 py-4">{sections.reference}</div>;
      default:
        return null;
    }
  })();

  return (
    <RecipeNavProvider value={{ navigateToGuide }}>
      <div
        ref={shellRef}
        className="dashboard-shell flex min-h-screen min-w-0 flex-col bg-background lg:min-h-[100dvh] lg:max-w-[100vw] lg:overflow-x-clip"
      >
        <MobileAppHeader form={form} className="lg:hidden" />

        <header className="sticky top-0 z-30 hidden border-b border-border-subtle bg-surface/95 shadow-sm backdrop-blur-md lg:block">
          <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-3 px-6">
            <AppBrandHeader tagline={heContent.app.brandSubtitle} logoSize={40} />
            {showResults && (
              <button
                type="button"
                className="touch-target inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 text-sm font-medium text-text-secondary shadow-sm hover:border-accent/30 hover:text-accent"
                onClick={() => {
                  document
                    .getElementById("recipe-editor-panel")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <PencilSquareIcon className="h-5 w-5" aria-hidden />
                {heContent.luxury.editRecipe}
              </button>
            )}
          </div>
        </header>

        <StickyMetricsBar form={form} className="hidden lg:block" />

        <div className="content-safe-bottom mx-auto w-full min-w-0 max-w-[100rem] lg:flex lg:flex-1 lg:flex-row lg:items-start lg:gap-8 lg:px-6 lg:py-6">
          {/* Mobile — document scroll (no nested overflow trap) */}
          <div className="lg:hidden">
            {sections.warnings && (
              <div className="px-4 pt-3">{sections.warnings}</div>
            )}
            {mobilePanel}
          </div>

          {/* Desktop — sidebar + main */}
          <aside
            id="recipe-editor-panel"
            className={cn(
              "hidden w-full min-w-0 shrink-0 overflow-x-hidden lg:block",
              "lg:w-[26rem] lg:max-w-[42%] xl:w-[28rem]",
              "lg:sticky lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h)+1rem)]",
              "lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h)-2rem)]",
              "lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain scrollbar-thin",
            )}
            aria-label={heContent.luxury.editorTitle}
          >
            <div className="app-card max-w-full overflow-x-clip p-5">
              <h2 className="mb-4 font-serif text-lg font-medium text-text-primary">
                {heContent.luxury.editorTitle}
              </h2>
              <RecipeInputsPanel
                form={form}
                calculateFlow={calculateFlow}
                surface="sidebar"
              />
            </div>
          </aside>

          <main
            id="main"
            className={cn(
              "hidden min-w-0 flex-1 lg:block",
              (showResults || starterOnlyView) &&
                "lg:sticky lg:top-[calc(var(--shell-header-h)+var(--shell-metrics-h)+1rem)] lg:max-h-[calc(100vh-var(--shell-header-h)-var(--shell-metrics-h)-2rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain scrollbar-thin",
            )}
          >
            {sections.warnings}

            {starterOnlyView ? (
              <div className="space-y-4">{sections.guide}</div>
            ) : !showResults ? (
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

        <footer className="hidden border-t border-border-subtle py-5 text-center text-xs text-text-muted lg:block">
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
          footer={editSheetFooter}
        >
          <RecipeInputsPanel
            form={form}
            calculateFlow={calculateFlow}
            surface="sheet"
            compact
            hidePrimaryCta
          />
        </Sheet>

        <MobileShellBottom
          shellRef={shellRef}
          activeTab={mobileTab}
          onSelectTab={setMobileTab}
          guideVisible={!!sections.guide || starterOnlyView}
          showCta={mobileTab === "inputs"}
          showResults={showResults}
          canCalculate={calculateFlow.validation.canCalculate}
          onCalculate={requestCalculate}
        />
      </div>
    </RecipeNavProvider>
  );
}
