"use client";

import { Suspense } from "react";
import { SourdoughApp } from "@/components/SourdoughApp";

function RecipeParamsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <p className="text-sm text-stone-600">טוען מתכון…</p>
    </div>
  );
}

/** Wraps app in Suspense — required for `useSearchParams` in static export. */
export function RecipeParamsProvider() {
  return (
    <Suspense fallback={<RecipeParamsFallback />}>
      <SourdoughApp />
    </Suspense>
  );
}
