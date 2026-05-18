import type { FlourKey } from "./types";

/** Soft, muted artisanal palette for flour mix visualization */
export const FLOUR_CHART_COLORS: Record<FlourKey, string> = {
  bread: "#c4a882",
  whiteWheat: "#e8e0d4",
  manitoba: "#d4a96a",
  durum: "#e2cfa0",
  pizza: "#dcc9a8",
  allPurpose: "#ddd5c8",
  wholeWheat: "#9a7f5c",
  wholeRye: "#7a6348",
  spelt: "#b39a72",
  buckwheat: "#8f7d62",
};

export function getFlourColor(key: FlourKey): string {
  return FLOUR_CHART_COLORS[key];
}
