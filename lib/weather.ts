import type { WeatherRecommendation } from "./types";

export type { WeatherRecommendation };

interface ForecastItem {
  dt: number;
  main: { temp: number };
}

declare global {
  interface Window {
    SOURDOUGH_CONFIG?: {
      openWeatherApiKey?: string;
    };
  }
}

/** API key: inline config (layout) → client env → public/config.js */
export function getOpenWeatherApiKey(): string {
  if (typeof window !== "undefined") {
    const fromConfig = window.SOURDOUGH_CONFIG?.openWeatherApiKey?.trim();
    if (fromConfig && !fromConfig.startsWith("YOUR_")) return fromConfig;
  }

  const fromEnv = (
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
    process.env.OPENWEATHER_API_KEY ||
    ""
  ).trim();

  return fromEnv;
}

export function averageTempNext6Hours(forecastList: ForecastItem[]): number | null {
  const now = Date.now();
  const end = now + 6 * 3_600_000;
  const temps: number[] = [];

  forecastList.forEach((item) => {
    const t = item.dt * 1000;
    if (t >= now - 1_800_000 && t <= end) temps.push(item.main.temp);
  });

  if (!temps.length && forecastList.length) {
    return (
      forecastList.slice(0, 2).reduce((s, i) => s + i.main.temp, 0) /
      Math.min(2, forecastList.length)
    );
  }
  if (!temps.length) return null;
  return temps.reduce((a, b) => a + b, 0) / temps.length;
}

export function recommendStarterFromAvgTemp(avgC: number): WeatherRecommendation {
  if (avgC > 27) {
    return {
      tier: "hot",
      pct: 12,
      range: "10%–15%",
      title: "חם מאוד — האטת התפחה",
      body: `ממוצע הטמפרטורה ב־6 השעות הקרובות הוא ${avgC.toFixed(1)}°C. התפחה תהיה מהירה — מומלץ להפחית מחמצת ל־10%–15%.`,
    };
  }
  if (avgC >= 22 && avgC <= 26) {
    return {
      tier: "ideal",
      pct: 20,
      range: "20%",
      title: "טמפרטורת חדר אידיאלית",
      body: `ממוצע ${avgC.toFixed(1)}°C ב־6 השעות הקרובות — טווח נוח לאפייה. מומלץ להישאר עם ~20% מחמצת.`,
    };
  }
  return {
    tier: "cold",
    pct: 27,
    range: "25%–30%",
    title: "קריר — האיצת התפחה",
    body: `ממוצע ${avgC.toFixed(1)}°C ב־6 השעות הקרובות — התפחה איטית יותר. מומלץ להעלות מחמצת ל־25%–30%.`,
  };
}

export async function fetchLocalWeatherForecast(): Promise<{
  avgTemp: number;
  locationLabel: string;
}> {
  const key = getOpenWeatherApiKey();
  if (!key) throw new Error("missing_api_key");

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error("no_geolocation"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 300_000,
    });
  });

  const { latitude: lat, longitude: lon } = position.coords;
  const url =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}` +
    `&appid=${encodeURIComponent(key)}&units=metric&lang=he`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather_${res.status}`);

  const data = (await res.json()) as {
    list?: ForecastItem[];
    city?: { name?: string };
  };

  const avg = averageTempNext6Hours(data.list || []);
  if (avg == null) throw new Error("no_forecast");

  const locationLabel =
    data.city?.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  return { avgTemp: avg, locationLabel };
}
