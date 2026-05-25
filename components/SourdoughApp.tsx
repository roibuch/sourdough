"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { alarmToastMessage } from "@/components/AlarmButton";
import { BakingTimeline } from "@/components/BakingTimeline";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RecipeResultsDetails } from "@/components/dashboard/RecipeResultsDetails";
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

  const timeline = (
    <div className="space-y-4">
      {hydrationAlerts.length > 0 && (
        <SmartWarningBanner alerts={hydrationAlerts} />
      )}
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
        onAlarmResult={(type) => form.showToast(alarmToastMessage(type))}
      />
      <OptionalSchedulePanel form={form} />
    </div>
  );

  const guide = form.showGuide ? (
    <div className="glass-panel min-w-0 overflow-x-clip">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="font-serif text-lg font-normal text-text-primary">
          מדריך אפייה
        </h2>
      </div>
      <div className="p-4 sm:p-6">
        <BakingGuide form={form} />
      </div>
    </div>
  ) : null;

  return (
    <>
      <ServiceWorkerRegister onUpdateAvailable={onSwUpdate} />
      <DashboardShell
        form={form}
        calculateFlow={calculateFlow}
        timeline={timeline}
        starterPanel={<StarterPanel form={form} />}
        guide={guide}
        resultsDetails={<RecipeResultsDetails form={form} />}
      />
      <Toast payload={swToast ?? form.toast} />
    </>
  );
}
