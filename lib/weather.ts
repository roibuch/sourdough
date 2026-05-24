import { heContent, t } from "@/lib/content";
import type { WeatherRecommendation } from "./types";

const weatherCopy = heContent.weather.recommendations;

export type { WeatherRecommendation };

export interface ForecastItem {
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

function readKeyFromInlineScript(): string {
  if (typeof document === "undefined") return "";
  const el = document.getElementById("sourdough-openweather-config");
  const text = el?.textContent || el?.innerHTML || "";
  if (!text) return "";
  const quoted = text.match(/openWeatherApiKey\s*:\s*"([^"]+)"/);
  if (quoted?.[1]) return quoted[1].trim();
  return "";
}

function ensureWindowConfig(key: string): void {
  if (typeof window === "undefined" || !key) return;
  window.SOURDOUGH_CONFIG = {
    ...window.SOURDOUGH_CONFIG,
    openWeatherApiKey: key,
  };
}

/** API key: window config → inline script → build-time env */
export function getOpenWeatherApiKey(): string {
  if (typeof window !== "undefined") {
    const fromConfig = window.SOURDOUGH_CONFIG?.openWeatherApiKey?.trim();
    if (fromConfig && !fromConfig.startsWith("YOUR_")) return fromConfig;
  }

  const fromScript = readKeyFromInlineScript();
  if (fromScript) {
    ensureWindowConfig(fromScript);
    return fromScript;
  }

  const fromEnv = (
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
    process.env.OPENWEATHER_API_KEY ||
    ""
  ).trim();

  if (fromEnv) ensureWindowConfig(fromEnv);

  return fromEnv;
}

/** Linear interpolation between OpenWeather 3-hour forecast points */
export function interpolateTempAt(
  forecastList: ForecastItem[],
  atMs: number,
): number | null {
  if (!forecastList.length) return null;
  const sorted = [...forecastList].sort((a, b) => a.dt - b.dt);
  const firstMs = sorted[0].dt * 1000;
  const lastMs = sorted[sorted.length - 1].dt * 1000;

  if (atMs <= firstMs) return sorted[0].main.temp;
  if (atMs >= lastMs) return sorted[sorted.length - 1].main.temp;

  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = sorted[i].dt * 1000;
    const t1 = sorted[i + 1].dt * 1000;
    if (atMs >= t0 && atMs <= t1) {
      const ratio = (t1 - t0) > 0 ? (atMs - t0) / (t1 - t0) : 0;
      return (
        sorted[i].main.temp +
        ratio * (sorted[i + 1].main.temp - sorted[i].main.temp)
      );
    }
  }
  return sorted[sorted.length - 1].main.temp;
}

/** Mean temperature across a work window (samples every 30 minutes) */
export function averageTempInWindow(
  forecastList: ForecastItem[],
  startMs: number,
  endMs: number,
): number | null {
  if (endMs <= startMs) return interpolateTempAt(forecastList, startMs);

  const samples: number[] = [];
  const stepMs = 30 * 60 * 1000;
  for (let t = startMs; t < endMs; t += stepMs) {
    const temp = interpolateTempAt(forecastList, t);
    if (temp != null) samples.push(temp);
  }
  const endTemp = interpolateTempAt(forecastList, endMs - 1);
  if (endTemp != null) samples.push(endTemp);
  if (!samples.length) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
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
  const avg = avgC.toFixed(1);
  if (avgC > 27) {
    const r = weatherCopy.hot;
    return { ...r, body: t(r.body, { avg }) };
  }
  if (avgC >= 22 && avgC <= 26) {
    const r = weatherCopy.ideal;
    return { ...r, body: t(r.body, { avg }) };
  }
  const r = weatherCopy.cold;
  return { ...r, body: t(r.body, { avg }) };
}

export async function fetchLocalWeatherForecast(): Promise<{
  avgTemp: number;
  locationLabel: string;
  forecastList: ForecastItem[];
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

  return {
    avgTemp: avg,
    locationLabel,
    forecastList: data.list || [],
  };
}
