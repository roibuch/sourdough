"use client";

import { useState } from "react";
import {
  CloudIcon,
  MapPinIcon,
  SunIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  fetchLocalWeatherForecast,
  getOpenWeatherApiKey,
  recommendStarterFromAvgTemp,
} from "@/lib/weather";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { WeatherRecommendation } from "@/lib/types";
import { cn } from "@/lib/cn";

const TIER_STYLES: Record<
  WeatherRecommendation["tier"],
  { card: string; icon: typeof SunIcon }
> = {
  hot: {
    card: "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50",
    icon: SunIcon,
  },
  ideal: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50",
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
  const [locationLabel, setLocationLabel] = useState("");
  const [avgTemp, setAvgTemp] = useState<number | null>(null);

  const handleFetch = async () => {
    if (!getOpenWeatherApiKey()) {
      setRec({
        tier: "error",
        pct: 0,
        range: "",
        title: "לא ניתן לטעון תחזית",
        body: "הגדירו NEXT_PUBLIC_OPENWEATHER_API_KEY בקובץ .env.local",
      });
      return;
    }

    setLoading(true);
    setRec(null);

    try {
      const data = await fetchLocalWeatherForecast();
      const recommendation = recommendStarterFromAvgTemp(data.avgTemp);
      setAvgTemp(data.avgTemp);
      setLocationLabel(data.locationLabel);
      setRec(recommendation);
    } catch (e) {
      const msg =
        e instanceof Error && e.message === "no_geolocation"
          ? "לא ניתן לקבל מיקום — אפשרו גישה למיקום בדפדפן."
          : "לא הצלחנו לטעון תחזית. נסו/י שוב מאוחר יותר.";
      setRec({
        tier: "error",
        pct: 0,
        range: "",
        title: "שגיאה בטעינה",
        body: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!rec || rec.tier === "error") return;
    form.setStarterPct(rec.pct);
    form.schedulePersist();
    form.showToast(`הוחל ${rec.pct}% מחמצת לפי מזג האוויר.`);
  };

  const tierStyle = rec ? TIER_STYLES[rec.tier] : null;
  const WeatherIcon = tierStyle?.icon ?? CloudArrowDownIcon;

  return (
    <Card nested className="mb-8 border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/30">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <CloudIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            דוח מזג אוויר
          </h3>
          <p className="text-sm text-stone-600">
            המלצה מותאמת אישית לאחוז המחמצת לפי הטמפרטורה ב־6 השעות הקרובות
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
        {loading ? "טוען תחזית מקומית…" : "בדיקת מזג אוויר והמלצת מחמצת"}
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
              {rec.tier !== "error" && (
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  מומלץ: {rec.pct}%
                  <span className="ms-2 text-sm font-normal text-stone-600">
                    (טווח {rec.range})
                  </span>
                </p>
              )}
            </div>
          </div>

          {avgTemp != null && locationLabel && (
            <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" aria-hidden />
                {locationLabel}
              </span>
              <span>
                טמפרטורה ממוצעת:{" "}
                <strong className="text-stone-800">{avgTemp.toFixed(1)}°C</strong>
              </span>
            </p>
          )}

          <p className="text-sm leading-relaxed text-stone-700">{rec.body}</p>

          {rec.tier !== "error" && (
            <Button
              variant="primary"
              className="mt-4"
              onClick={handleApply}
            >
              החל/י {rec.pct}% מחמצת
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
