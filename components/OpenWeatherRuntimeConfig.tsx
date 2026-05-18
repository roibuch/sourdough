import { getBuildTimeOpenWeatherKey } from "@/lib/openWeatherKey";

/**
 * Injects the API key into the page before React hydrates (static export + dev).
 * Works when NEXT_PUBLIC_* is only available at build time on the server.
 */
export function OpenWeatherRuntimeConfig() {
  const key = getBuildTimeOpenWeatherKey();
  if (!key) return null;

  return (
    <script
      id="sourdough-openweather-config"
      dangerouslySetInnerHTML={{
        __html: `window.SOURDOUGH_CONFIG=Object.assign(window.SOURDOUGH_CONFIG||{},{openWeatherApiKey:${JSON.stringify(key)}});`,
      }}
    />
  );
}
