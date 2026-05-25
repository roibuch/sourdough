import { getBasePath } from "@/lib/basePath";

/** App brand — warm light */
export const BRAND = {
  themeColor: "#F5F2EB",
  backgroundColor: "#F5F2EB",
  accent: "#B45309",
  surface: "#FFFFFF",
  textPrimary: "#1C1917",
} as const;

export function brandAssetPath(filename: string): string {
  const base = getBasePath();
  return base ? `${base}/${filename}` : `/${filename}`;
}
