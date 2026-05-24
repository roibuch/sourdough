"use client";

import { BakingGuide } from "@/components/BakingGuide";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RecipeResultsPanel } from "@/components/dashboard/RecipeResultsPanel";
import { SectionErrorBoundary } from "@/components/feedback/SectionErrorBoundary";
import { SmartWarningBanner } from "@/components/feedback/SmartWarningBanner";
import { useBakerAlerts } from "@/hooks/useBakerAlerts";
import { ReferenceTables } from "@/components/ReferenceTables";
import { ReverseTimeline } from "@/components/ReverseTimeline";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toast } from "@/components/Toast";
import { useRecipeForm } from "@/hooks/useRecipeForm";

export function SourdoughApp() {
  const form = useRecipeForm();
  const bakerAlerts = useBakerAlerts(form);
  const hydrationAlerts = bakerAlerts.filter((a) =>
    a.id.startsWith("hydration"),
  );

  const outputs = (
    <>
      {hydrationAlerts.length > 0 && (
        <SmartWarningBanner alerts={hydrationAlerts} />
      )}
      <RecipeResultsPanel form={form} />
      <section
        id="section-schedule"
        className="scroll-mt-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.5rem)]"
      >
        <div className="glass-panel min-w-0 overflow-x-clip">
          <div className="border-b border-stone-200/70 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-serif text-lg font-semibold text-charcoal sm:text-xl md:text-2xl">
              תזמון ולוח אפייה
            </h2>
            <p className="mt-1 text-xs text-stone-600 sm:text-sm">
              מועד מוכן, מזג אוויר והתראות — עדכון מיידי לפי הפרמטרים.
            </p>
          </div>
          <div className="p-3 sm:p-6 md:p-8">
            <SectionErrorBoundary title="שגיאה באזור התזמון">
              <ReverseTimeline form={form} />
            </SectionErrorBoundary>
          </div>
        </div>
      </section>
    </>
  );

  const guide =
    form.showGuide ? (
      <section
        id="section-guide"
        className="scroll-mt-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.5rem)]"
      >
        <div className="glass-panel min-w-0 overflow-x-clip">
          <div className="border-b border-stone-200/70 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-serif text-xl font-semibold text-charcoal">
              מדריך אפייה
            </h2>
          </div>
          <div className="p-3 sm:p-6 md:p-8">
            <BakingGuide form={form} />
          </div>
        </div>
      </section>
    ) : null;

  const reference = (
    <section
      id="section-reference"
      className="scroll-mt-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.5rem)]"
    >
      <div className="glass-panel min-w-0 overflow-x-clip">
        <div className="border-b border-stone-200/70 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-serif text-xl font-semibold text-charcoal">
            טבלאות עזר
          </h2>
        </div>
        <div className="p-3 sm:p-6 md:p-8">
          <ReferenceTables />
        </div>
      </div>
    </section>
  );

  return (
    <>
      <ServiceWorkerRegister />
      <DashboardShell
        form={form}
        outputs={outputs}
        guide={guide}
        reference={reference}
      />
      <Toast message={form.toast} />
    </>
  );
}
