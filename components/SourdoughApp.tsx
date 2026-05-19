"use client";

import { BakingGuide } from "@/components/BakingGuide";
import { RecipeCalculator } from "@/components/RecipeCalculator";
import { ReferenceTables } from "@/components/ReferenceTables";
import { ReverseTimeline } from "@/components/ReverseTimeline";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toast } from "@/components/Toast";
import { useRecipeForm } from "@/hooks/useRecipeForm";

export function SourdoughApp() {
  const form = useRecipeForm();

  return (
    <div className="space-y-0">
      <ServiceWorkerRegister />
      <RecipeCalculator form={form} />
      <ReverseTimeline form={form} />
      <BakingGuide form={form} />
      <ReferenceTables />
      <Toast message={form.toast} />
    </div>
  );
}
