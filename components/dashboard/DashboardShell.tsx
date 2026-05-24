"use client";

import { useState, type ReactNode } from "react";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { MobileBottomNav, type MobileTab } from "@/components/dashboard/MobileBottomNav";
import { RecipeInputsPanel } from "@/components/dashboard/RecipeInputsPanel";
import { Sheet } from "@/components/ui/Sheet";
import { StickyMetricsBar } from "@/components/dashboard/StickyMetricsBar";
import type { RecipeForm } from "@/hooks/useRecipeForm";
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
    <div className="dashboard-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-warm-border/70 bg-dough/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <AppBrandHeader
            tagline="מחשבון בצק, לוח אפייה ומדריך — מותאם לנייד"
            logoSize={44}
          />
        </div>
      </header>

      <StickyMetricsBar form={form} />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        {/* Desktop: sticky inputs sidebar */}
        <aside
          className={cn(
            "hidden w-full shrink-0 border-warm-border/70 lg:block lg:w-[22rem] xl:w-96",
            "lg:sticky lg:top-[7.25rem] lg:self-start lg:border-e",
            "lg:max-h-[calc(100vh-7.25rem)] lg:overflow-y-auto lg:overscroll-contain",
            "lg:px-4 lg:py-6",
          )}
          aria-label="פרמטרי מתכון"
        >
          <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-charcoal-muted">
            התאמת מתכון
          </p>
          <RecipeInputsPanel form={form} />
        </aside>

        {/* Main outputs */}
        <main
          id="main"
          className={cn(
            "min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6",
            "pb-24 lg:pb-8",
          )}
        >
          <div className="lg:hidden">
            {mobileTab === "outputs" && (
              <div className="space-y-6">{outputs}</div>
            )}
            {mobileTab === "guide" && guide && (
              <div className="space-y-6">{guide}</div>
            )}
            {mobileTab === "reference" && (
              <div className="space-y-6">{reference}</div>
            )}
          </div>

          <div className="hidden space-y-8 lg:block">{outputs}</div>
          {guide && <div className="mt-8 hidden lg:block">{guide}</div>}
          <div className="mt-8 hidden lg:block">{reference}</div>

          <footer className="mt-12 border-t border-warm-border/70 pt-6 text-center text-xs text-charcoal-muted">
            Sourdough Master — נשמר ב־URL וב־localStorage
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
