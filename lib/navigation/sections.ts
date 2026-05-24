import type { ComponentType, SVGProps } from "react";
import {
  BeakerIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

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

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    label: "מרכיבי בצק",
    icon: CalculatorIcon,
    items: [
      {
        id: "ingredients",
        label: "מתכון ואחוזים",
        description: "משקל, מים, מחמצת ותערובת קמחים",
        anchor: "section-ingredients",
      },
    ],
  },
  {
    id: "starter",
    label: "מחמצת / לאבן",
    icon: BeakerIcon,
    items: [
      {
        id: "starter",
        label: "האכלה ומצב מואץ",
        description: "יחסי האכלה, חימום וכמויות",
        anchor: "section-starter",
      },
    ],
    defaultCollapsed: false,
  },
  {
    id: "timing",
    label: "תזמון ולוח",
    icon: CalendarDaysIcon,
    items: [
      {
        id: "schedule",
        label: "מועד אפייה ולוח",
        description: "בחירת מועד, מזג אוויר והתראות",
        anchor: "section-schedule",
      },
      {
        id: "guide",
        label: "מדריך שלבים",
        description: "אוטוליזה, bulk, אפייה",
        anchor: "section-guide",
      },
    ],
  },
  {
    id: "advanced",
    label: "מתקדם",
    icon: Cog6ToothIcon,
    defaultCollapsed: true,
    items: [
      {
        id: "reference",
        label: "טבלאות ייחוס",
        description: "Bulk, מקרר והמלצות",
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

/** Placeholder pro-tips per section (expandable in SectionPanel) */
export const SECTION_PRO_TIPS: Partial<Record<AppSectionId, string[]>> = {
  ingredients: [
    "אחוזי הקמחים חייבים להסתכם ל־100% — המערכת תציג שגיאה אם לא.",
    "הידרציה אמיתית כוללת את המים שבבסינאז׳ — בדקו את טווח ההמלצה לתערובת.",
  ],
  starter: [
    "1:1:1 מתאים כשיש מעט זמן; 1:0.5:0.5 מהיר יותר עם מחמצת חזקה.",
    "במצב מואץ — שקלו חימום בתנור (נורה בלבד) או מיקרוגל כבוי.",
    "DDT: מדדו טמפרטורת קמח ומחמצת — מים חמים/קרים לפי המחשבון.",
  ],
  schedule: [
    "עבודה פעילה מתוכננת רק בין 7:00–21:00 — בלי התעוררות בלילה.",
    "באנדרואיד: «שעון» לשעון מעורר, «יומן» לאירוע עם התראה.",
  ],
  guide: [
    "עצרו bulk לפי נפח (jiggle test) — לא רק לפי השעון.",
    "בסינאז׳: החזיקו מים בצד ושילבו בשלב הלישה.",
  ],
};

export const APP_TAGLINE =
  "חישוב בצק, תזמון חכם ומדריך שלבים — מותאם לבית אפייה.";
