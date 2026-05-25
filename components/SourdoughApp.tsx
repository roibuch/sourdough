"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { alarmToastMessage } from "@/components/AlarmButton";
import { BakingTimeline } from "@/components/BakingTimeline";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ResultsHero } from "@/components/dashboard/ResultsHero";
import { RecipeResultsDetails } from "@/components/dashboard/RecipeResultsDetails";
import { WelcomeEmptyState } from "@/components/dashboard/WelcomeEmptyState";
import { StarterFloatTestAlert } from "@/components/StarterFloatTestAlert";
import { SmartWarningBanner } from "@/components/feedback/SmartWarningBanner";
import { useBakerAlerts } from "@/hooks/useBakerAlerts";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";
import { Toast, type ToastPayload } from "@/components/Toast";
import { StarterPanel } from "@/components/sections/StarterPanel";
import { useRecipeForm } from "@/hooks/useRecipeForm";
import { useRecipeCalculateFlow } from "@/hooks/useRecipeCalculateFlow";
import { heContent } from "@/lib/content";

const BakingGuide = dynamic(
  () =>
    import("@/components/BakingGuide").then((m) => ({ default: m.BakingGuide })),
  { loading: () => <PanelSkeleton className="min-h-[20rem]" /> },
);

const ReferenceTables = dynamic(
  () =>
    import("@/components/ReferenceTables").then((m) => ({
      default: m.ReferenceTables,
    })),
  { loading: () => <PanelSkeleton className="min-h-[16rem]" /> },
);

const OptionalSchedulePanel = dynamic(
  () =>
    import("@/components/scheduling/OptionalSchedulePanel").then((m) => ({
      default: m.OptionalSchedulePanel,
    })),
  { loading: () => null },
);

export function SourdoughApp() {
  const form = useRecipeForm();
  const calculateFlow = useRecipeCalculateFlow(form);
  const [swToast, setSwToast] = useState<ToastPayload>(null);
  const bakerAlerts = useBakerAlerts(form);

  const onSwUpdate = useCallback((reload: () => void) => {
    setSwToast({
      message: heContent.toasts.swUpdate.message,
      actionLabel: heContent.toasts.swUpdate.action,
      onAction: reload,
    });
  }, []);

  const hydrationAlerts = bakerAlerts.filter((a) =>
    a.id.startsWith("hydration"),
  );

  const { showResults } = form;

  const outputs = (
    <div className="space-y-4 sm:space-y-6">
      {hydrationAlerts.length > 0 && (
        <SmartWarningBanner alerts={hydrationAlerts} />
      )}

      {showResults ? (
        <>
          <ResultsHero form={form} />
          <RecipeResultsDetails form={form} />
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
            showFloatTestReminder
            onAlarmResult={(type) => form.showToast(alarmToastMessage(type))}
          />
          <OptionalSchedulePanel form={form} />
          <StarterPanel form={form} />
        </>
      ) : (
        <WelcomeEmptyState />
      )}
    </div>
  );

  const guide = form.showGuide ? (
    <section id="section-guide" className="scroll-mt-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.5rem)]">
      <div className="app-card min-w-0 overflow-x-clip p-4 sm:p-6">
        <h2 className="mb-4 font-serif text-xl font-medium text-text-primary">
          מדריך אפייה
        </h2>
        <BakingGuide form={form} />
      </div>
    </section>
  ) : null;

  const reference = (
    <section
      id="section-reference"
      className="scroll-mt-[calc(var(--shell-header-h)+var(--shell-metrics-h)+0.5rem)]"
    >
      <div className="app-card min-w-0 overflow-x-clip p-4 sm:p-6">
        <h2 className="mb-4 font-serif text-xl font-medium text-text-primary">
          {heContent.navigation.items.reference.label}
        </h2>
        <ReferenceTables />
      </div>
    </section>
  );

  return (
    <>
      <ServiceWorkerRegister onUpdateAvailable={onSwUpdate} />
      <DashboardShell
        form={form}
        calculateFlow={calculateFlow}
        outputs={outputs}
        guide={guide}
        reference={reference}
      />
      <Toast payload={swToast ?? form.toast} />
    </>
  );
}
