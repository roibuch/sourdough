import { ALERTS_HE } from "@/lib/content/he/alerts";
import { ALARMS_HE } from "@/lib/content/he/alarms";
import { APP_HE } from "@/lib/content/he/app";
import { DDT_HE } from "@/lib/content/he/ddt";
import { EXPRESS_HE } from "@/lib/content/he/express";
import { FLOUR_HE } from "@/lib/content/he/flour";
import { GLOSSARY_HE } from "@/lib/content/he/glossary";
import { GUIDE_HE } from "@/lib/content/he/guide";
import { INPUTS_HE } from "@/lib/content/he/inputs";
import { NAVIGATION_HE } from "@/lib/content/he/navigation";
import { OPTIONAL_SCHEDULE_HE } from "@/lib/content/he/optionalSchedule";
import { SCHEDULE_HE } from "@/lib/content/he/schedule";
import { SCHEDULING_HE } from "@/lib/content/he/scheduling";
import { TIMELINE_HE } from "@/lib/content/he/timeline";
import { TOASTS_HE } from "@/lib/content/he/toasts";
import { VALIDATION_HE } from "@/lib/content/he/validation";
import { WEATHER_HE } from "@/lib/content/he/weather";

/** Primary UI locale — Hebrew (he-IL). */
export const heContent = {
  app: APP_HE,
  navigation: NAVIGATION_HE,
  glossary: GLOSSARY_HE,
  timeline: TIMELINE_HE,
  alerts: ALERTS_HE,
  validation: VALIDATION_HE,
  scheduling: SCHEDULING_HE,
  toasts: TOASTS_HE,
  guide: GUIDE_HE,
  inputs: INPUTS_HE,
  flour: FLOUR_HE,
  alarms: ALARMS_HE,
  ddt: DDT_HE,
  schedule: SCHEDULE_HE,
  express: EXPRESS_HE,
  weather: WEATHER_HE,
  optionalSchedule: OPTIONAL_SCHEDULE_HE,
} as const;

export type HeContent = typeof heContent;
