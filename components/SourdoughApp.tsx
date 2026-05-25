"use client";

import dynamic from "next/dynamic";
import { BakingGuide } from "@/components/BakingGuide";
import { BakingTimeline } from "@/components/BakingTimeline";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RecipeResultsPanel } from "@/components/dashboard/RecipeResultsPanel";
import { StarterFloatTestAlert } from "@/components/StarterFloatTestAlert";
import { SmartWarningBanner } from "@/components/feedback/SmartWarningBanner";
import { useBakerAlerts } from "@/hooks/useBakerAlerts";
import { ReferenceTables } from "@/components/ReferenceTables";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toast } from "@/components/Toast";
import { useRecipeForm } from "@/hooks/useRecipeForm";

const OptionalSchedulePanel = dynamic(
  () =>
    import("@/components/scheduling/OptionalSchedulePanel").then((m) => ({
      default: m.OptionalSchedulePanel,
    })),
  { loading: () => null },
);

export function SourdoughApp() {
  const form = useRecipeForm();
  const bakerAlerts = useBakerAlerts(form);
  const hydrationAlerts = bakerAlerts.filter((a) =>
    a.id.startsWith("hydration"),
  );

  const outputs = (
    <div className="space-y-4 sm:space-y-6">
      {hydrationAlerts.length > 0 && (
        <SmartWarningBanner alerts={hydrationAlerts} />
      )}
      <div className="hidden space-y-4 lg:block">
        <StarterFloatTestAlert />
        <BakingTimeline
          dough={{
            starterPct: form.starterPct,
            waterPct: form.waterPct,
            flourPcts: form.flourDraft,
            roomTempC: form.roomTemp,
            hoursToAutolyse: form.hoursToAutolyse,
            coldRetardHours: form.coldRetardHours,
            fermentationPace: form.fermentationPace,
          }}
          showFloatTestReminder={false}
        />
      </div>
      <RecipeResultsPanel form={form} />
      <OptionalSchedulePanel form={form} />
    </div>
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
