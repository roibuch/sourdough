"use client";

import { useEffect, useState } from "react";
import {
  CloudIcon,
  MapPinIcon,
  SunIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  fetchLocalWeatherForecast,
  getOpenWeatherApiKey,
} from "@/lib/weather";
import {
  planBakingFromForecast,
  type BakingWeatherPlan,
} from "@/lib/weatherPlan";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { WeatherRecommendation } from "@/lib/types";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const wx = heContent.weather.panel;

const TIER_STYLES: Record<
  WeatherRecommendation["tier"],
  { card: string; icon: typeof SunIcon }
> = {
  hot: {
    card: "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50",
    icon: SunIcon,
  },
  ideal: {
    card: "border-wheat/60 bg-gradient-to-br from-wheat-muted to-dough",
    icon: SunIcon,
  },
  cold: {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 to-stone-50",
    icon: CloudIcon,
  },
  error: {
    card: "border-red-200 bg-red-50",
    icon: CloudIcon,
  },
};

export function WeatherPanel({ form }: { form: RecipeForm }) {
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<WeatherRecommendation | null>(null);
  const [plan, setPlan] = useState<BakingWeatherPlan | null>(null);
  const [locationLabel, setLocationLabel] = useState("");

  useEffect(() => {
    getOpenWeatherApiKey();
  }, []);

  const handleFetch = async () => {
    const apiKey = getOpenWeatherApiKey();
    if (!apiKey) {
      setRec({
        tier: "error",
        pct: 0,
        range: "",
        title: wx.loadErrorTitle,
        body: wx.loadErrorBody,
      });
      setPlan(null);
      return;
    }

    setLoading(true);
    setRec(null);
    setPlan(null);

    try {
      const data = await fetchLocalWeatherForecast();
      const bakingPlan = planBakingFromForecast(data.forecastList, {
        coldRetardHours: form.coldRetardHours,
        starterPct: form.starterPct,
        waterPct: form.waterPct,
        roomTemp: form.roomTemp,
        hoursToAutolyse: form.hoursToAutolyse,
        flourPcts: form.flourPcts,
      });

      if (!bakingPlan) throw new Error("no_plan");

      setLocationLabel(data.locationLabel);
      setPlan(bakingPlan);
      setRec(bakingPlan.recommendation);
    } catch (e) {
      const msg =
        e instanceof Error && e.message === "no_geolocation"
          ? wx.geoDenied
          : wx.planFailed;
      setRec({
        tier: "error",
        pct: 0,
        range: "",
        title: wx.fetchErrorTitle,
        body: msg,
      });
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!plan || !rec || rec.tier === "error") return;
    form.applyWeatherPlan(plan);
    form.schedulePersist();
    form.showToast(
      `תוכנן לפי מזג האוויר: ${plan.starterPct}% מחמצת, ${plan.hoursToAutolyse} שעות עד אוטוליזה, התפחה ראשונית ~${plan.bulkHours} שעות.`,
    );
  };

  const tierStyle = rec ? TIER_STYLES[rec.tier] : null;
  const WeatherIcon = tierStyle?.icon ?? CloudArrowDownIcon;

  return (
    <Card nested className="mb-8 border-wheat/50 bg-gradient-to-br from-white to-wheat-muted/40">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <CloudIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            תכנון לפי מזג אוויר
          </h3>
          <p className="text-sm text-stone-600">
            בודקים תחזית לכל שעות העבודה — האכלה, אוטוליזה והתפחה הראשונית — ומתאימים
            אחוזים ושעות בהתאם.
          </p>
        </div>
      </div>

      <Button
        variant="weather"
        fullWidth
        onClick={handleFetch}
        disabled={loading}
      >
        <CloudArrowDownIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {loading ? wx.loading : wx.planButton}
      </Button>

      {rec && tierStyle && (
        <div
          role="status"
          className={cn("mt-5 rounded-2xl border p-5 sm:p-6", tierStyle.card)}
        >
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
              <WeatherIcon className="h-6 w-6 text-stone-700" strokeWidth={1.5} />
            </span>
            <div>
              <h4 className="font-serif text-lg font-semibold text-stone-900">
                {rec.title}
              </h4>
              {rec.tier !== "error" && plan && (
                <p className="mt-1 text-2xl font-bold text-crust">
                  מומלץ: {plan.starterPct}% מחמצת
                  <span className="ms-2 text-sm font-normal text-stone-600">
                    (טווח {rec.range})
                  </span>
                </p>
              )}
            </div>
          </div>

          {plan && locationLabel && rec.tier !== "error" && (
            <>
              <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" aria-hidden />
                  {locationLabel}
                </span>
                <span>
                  {plan.hasTargetBake ? wx.planFromBake : wx.planFromNow}
                </span>
              </p>

              <div className="mb-4 grid gap-2 rounded-xl bg-white/70 p-3 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-stone-500">האכלה</span>
                  <p className="font-semibold text-stone-900">
                    {plan.starterWindowAvg.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-stone-500">
                    {plan.hoursToAutolyse} שעות
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">אוטוליזה</span>
                  <p className="font-semibold text-stone-900">
                    {plan.autolyseWindowAvg.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-stone-500">1 שעה</p>
                </div>
                <div>
                  <span className="text-stone-500">התפחה ראשונית</span>
                  <p className="font-semibold text-stone-900">
                    {plan.bulkWindowAvg.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-stone-500">~{plan.bulkHours} שעות</p>
                </div>
              </div>
            </>
          )}

          <p className="text-sm leading-relaxed text-stone-700">{rec.body}</p>

          {rec.tier !== "error" && plan && (
            <Button variant="primary" className="mt-4" onClick={handleApply}>
              החלת התכנון — {plan.starterPct}% מחמצת · {plan.hoursToAutolyse} שעות · התפחה{" "}
              {plan.bulkHours} שעות
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
