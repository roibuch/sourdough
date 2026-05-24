"use client";

import { BakingGuide } from "@/components/BakingGuide";
import { AppShell } from "@/components/layout/AppShell";
import { SectionPanel } from "@/components/layout/SectionPanel";
import { RecipeCalculator } from "@/components/RecipeCalculator";
import { ReferenceTables } from "@/components/ReferenceTables";
import { ReverseTimeline } from "@/components/ReverseTimeline";
import { DoughTemperatureCalculator } from "@/components/DoughTemperatureCalculator";
import { StarterPanel } from "@/components/sections/StarterPanel";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toast } from "@/components/Toast";
import { useRecipeForm } from "@/hooks/useRecipeForm";

export function SourdoughApp() {
  const form = useRecipeForm();

  return (
    <AppShell>
      <ServiceWorkerRegister />

      <SectionPanel
        id="section-ingredients"
        sectionId="ingredients"
        title="מרכיבי בצק"
        subtitle="משקל, אחוזים, תערובת קמחים ומזג אוויר."
      >
        <RecipeCalculator form={form} />
      </SectionPanel>

      <SectionPanel
        id="section-starter"
        sectionId="starter"
        title="מחמצת ולאבן"
        subtitle="יחסי האכלה, מצב מואץ וחישוב שליפה מהמקרר."
      >
        <StarterPanel form={form} />
        <div className="mt-8">
          <DoughTemperatureCalculator form={form} />
        </div>
      </SectionPanel>

      <SectionPanel
        id="section-schedule"
        sectionId="schedule"
        title="תזמון ולוח אפייה"
        subtitle="מועד מוכן, תכנון לפי מזג אוויר והתראות."
      >
        <ReverseTimeline form={form} />
      </SectionPanel>

      {form.showGuide && (
        <SectionPanel
          id="section-guide"
          sectionId="guide"
          title="מדריך אפייה"
          subtitle="אוטוליזה, bulk, מקרר ואפייה — שלב אחר שלב."
          defaultCollapsed={false}
        >
          <BakingGuide form={form} />
        </SectionPanel>
      )}

      <SectionPanel
        id="section-reference"
        sectionId="reference"
        title="הגדרות מתקדמות"
        subtitle="טבלאות ייחוס ל-bulk, מקרר והמלצות."
        defaultCollapsed
      >
        <ReferenceTables />
      </SectionPanel>

      <Toast message={form.toast} />
    </AppShell>
  );
}
