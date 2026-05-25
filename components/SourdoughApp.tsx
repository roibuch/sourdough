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

  const warnings =
    hydrationAlerts.length > 0 ? (
      <SmartWarningBanner alerts={hydrationAlerts} />
    ) : null;

  const sections = {
    empty: <WelcomeEmptyState />,
    hero: <ResultsHero form={form} />,
    recipe: <RecipeResultsDetails form={form} />,
    timeline: (
      <div className="space-y-4">
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
      </div>
    ),
    starter: <StarterPanel form={form} />,
    guide: form.showGuide ? (
      <div className="app-card p-4 sm:p-6">
        <BakingGuide form={form} />
      </div>
    ) : null,
    reference: (
      <div className="app-card overflow-x-auto p-4 sm:p-6">
        <ReferenceTables />
      </div>
    ),
    warnings,
  };

  return (
    <>
      <ServiceWorkerRegister onUpdateAvailable={onSwUpdate} />
      <DashboardShell
        form={form}
        calculateFlow={calculateFlow}
        sections={sections}
      />
      <Toast payload={swToast ?? form.toast} />
    </>
  );
}
