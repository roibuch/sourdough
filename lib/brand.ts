import { getBasePath } from "@/lib/basePath";

/** Luxury Artisan — dark boutique bakery */
export const BRAND = {
  themeColor: "#11100F",
  backgroundColor: "#11100F",
  accentGold: "#D4AF37",
  surface: "#1C1A19",
  textPrimary: "#F4F1EB",
} as const;

export function brandAssetPath(filename: string): string {
  const base = getBasePath();
  return base ? `${base}/${filename}` : `/${filename}`;
}
