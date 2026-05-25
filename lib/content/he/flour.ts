/** Flour types, presets, and blend notes. */
export const FLOUR_HE = {
  fields: {
    bread: "קמח לחם",
    whiteWheat: "חיטה לבנה",
    manitoba: "מניטובה",
    wholeWheat: "חיטה מלאה",
    wholeRye: "שיפון מלא",
    allPurpose: "רב תכליתי / אחר",
  },
  presets: {
    classic: "קלאסי — לחם, לבן, מלא",
    country: "כפרי — לחם, מניטובה, מלא, שיפון",
    whole: "דגש מלא — מלא ושיפון",
    custom: "מותאם אישית",
  },
  presetNotes: {
    classic: "תערובת יציבה ללחם יומיומי — קלה לעבודה.",
    country: "טעם כפרי עם מלא ושיפון; עדיין נוח לעיצוב.",
    whole: "יותר סיבים וטעם; קיפולים עדינים והידרציה מבוקרת.",
  },
  balanceTo100: "אזן ל־100%",
  totalLabel: "סה״כ תערובת",
} as const;
