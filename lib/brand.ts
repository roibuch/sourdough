import { getBasePath } from "@/lib/basePath";

/** Luxury Artisan — warm atelier */
export const BRAND = {
  themeColor: "#4A4541",
  backgroundColor: "#4A4541",
  accentGold: "#D4AF37",
  surface: "#57524E",
  textPrimary: "#FAF7F2",
} as const;

export function brandAssetPath(filename: string): string {
  const base = getBasePath();
  return base ? `${base}/${filename}` : `/${filename}`;
}
