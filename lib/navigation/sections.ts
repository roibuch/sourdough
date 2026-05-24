import type { ComponentType, SVGProps } from "react";
import {
  BeakerIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { heContent } from "@/lib/content";

export type AppSectionId =
  | "ingredients"
  | "starter"
  | "schedule"
  | "guide"
  | "reference";

export type NavGroupId =
  | "core"
  | "starter"
  | "timing"
  | "advanced";

export interface NavItem {
  id: AppSectionId;
  label: string;
  description: string;
  anchor: string;
}

export interface NavGroup {
  id: NavGroupId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  items: NavItem[];
  /** Collapsed by default on first visit */
  defaultCollapsed?: boolean;
}

const c = heContent.navigation;

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    label: c.groups.core,
    icon: CalculatorIcon,
    items: [
      {
        id: "ingredients",
        label: c.items.ingredients.label,
        description: c.items.ingredients.description,
        anchor: "section-ingredients",
      },
    ],
  },
  {
    id: "starter",
    label: c.groups.starter,
    icon: BeakerIcon,
    items: [
      {
        id: "starter",
        label: c.items.starter.label,
        description: c.items.starter.description,
        anchor: "section-starter",
      },
    ],
    defaultCollapsed: false,
  },
  {
    id: "timing",
    label: c.groups.timing,
    icon: CalendarDaysIcon,
    items: [
      {
        id: "schedule",
        label: c.items.schedule.label,
        description: c.items.schedule.description,
        anchor: "section-schedule",
      },
      {
        id: "guide",
        label: c.items.guide.label,
        description: c.items.guide.description,
        anchor: "section-guide",
      },
    ],
  },
  {
    id: "advanced",
    label: c.groups.advanced,
    icon: Cog6ToothIcon,
    defaultCollapsed: true,
    items: [
      {
        id: "reference",
        label: c.items.reference.label,
        description: c.items.reference.description,
        anchor: "section-reference",
      },
    ],
  },
];

export const ALL_SECTION_IDS: AppSectionId[] = NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => i.id),
);

export function getNavItem(id: AppSectionId): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
}

export const SECTION_PRO_TIPS: Partial<Record<AppSectionId, string[]>> = {
  ingredients: [...c.proTips.ingredients],
  starter: [...c.proTips.starter],
  schedule: [...c.proTips.schedule],
  guide: [...c.proTips.guide],
};

export const APP_TAGLINE = c.tagline;
