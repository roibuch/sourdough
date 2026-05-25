"use client";

import { SourdoughApp } from "@/components/SourdoughApp";
import { SectionErrorBoundary } from "@/components/feedback/SectionErrorBoundary";

/** Client shell — calculator renders immediately with defaults; URL hydrates after mount. */
export function RecipeParamsProvider() {
  return (
    <SectionErrorBoundary title="שגיאה בטעינת האפליקציה">
      <SourdoughApp />
    </SectionErrorBoundary>
  );
}
