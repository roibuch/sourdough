import type { PresetKey } from "./types";

export const STORAGE_KEY = "sourdough-master-state-v1";

export interface RecipeFormSnapshot {
  totalWeight: string;
  waterPct: number;
  starterPct: number;
  saltPct: number;
  preset: PresetKey;
  flourPcts: number[];
  targetBakeTime: string;
  coldRetardHours: number;
  hoursToAutolyse: number;
  roomTemp: number;
  keepInJarG: number;
  useRecipeStarter: boolean;
  manualStarterG: string;
  fermentationPace?: string;
  restMethod?: string;
  starterRatioPreset?: string;
  calculated?: boolean;
}
