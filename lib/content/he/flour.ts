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
  balanceDialog: {
    title: "סך הקמחים חורג מ־100%",
    body: "כרגע {total}% (הפרש {delta}%). רוצים שנתקן זאת אוטומטית?",
    adjustOne: "להוסיף או להפחית את ההפרש בקמח אחד שאבחר",
    proportional: "לחלק את ההפרש בין כל הקמחים (יחסי)",
    preview: "אחרי העיגול:",
    confirm: "איזון ו«יצירת מתכון»",
    cancel: "ביטול",
  },
} as const;
