/** Server/build-time OpenWeather key (from .env, .env.local, or CI secrets) */
export function getBuildTimeOpenWeatherKey(): string {
  return (
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
    process.env.OPENWEATHER_API_KEY ||
    ""
  ).trim();
}
