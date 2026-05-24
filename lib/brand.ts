import { getBasePath } from "@/lib/basePath";

/** Artisan sourdough brand palette */
export const BRAND = {
  themeColor: "#7a4f2e",
  backgroundColor: "#faf7f2",
  crust: "#7a4f2e",
  crustDark: "#5c3a22",
  wheat: "#d4a574",
  wheatLight: "#e8cfa0",
  dough: "#faf7f2",
  charcoal: "#2e2b28",
} as const;

export function brandAssetPath(filename: string): string {
  const base = getBasePath();
  return base ? `${base}/${filename}` : `/${filename}`;
}
