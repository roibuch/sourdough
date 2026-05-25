/** Recipe inputs panel & dashboard labels. */
export const INPUTS_HE = {
  accordion: {
    dough: "כמה בצק ומה בו?",
    flour: "אילו קמחים?",
    starter: "מחמצת (אופציונלי)",
    timing: "מתי לאפות?",
    ddt: "טמפרטורת מים ללישה",
  },
  fields: {
    doughWeight: "כמה בצק נרצה להכין? (גרם)",
    hydration: "אחוז נוזלים (הידרציה)",
    hydrationHint:
      "כמה מים יש בבצק ביחס לקמח. בצק נוקשה ≈ 65%, בצק רך מאוד ≈ 80%.",
    inoculation: "אחוז מחמצת בבצק (%)",
    salt: "מלח (%)",
    flourPreset: "תערובת מומלצת",
    roomTemp: "טמפרטורת החדר (°C)",
    hoursToAutolyse: "שעות עד מנוחת בצק ראשונית (אוטוליזה)",
    coldRetard: "התפחה שנייה (במקרר) — שעות",
    targetBake: "מתי הלחם צריך להיות מוכן?",
  },
  actions: {
    calculate: "צור מתכון עכשיו",
    share: "שיתוף קישור לנוסחה",
    clearStorage: "איפוס שמירה מקומית",
    starterOnly: "מדריך מחמצת בלבד",
    decreaseWeight: "הפחת משקל",
    increaseWeight: "הוסף משקל",
    decreaseInoculation: "הפחת מחמצת",
    increaseInoculation: "הוסף מחמצת",
    decreaseSalt: "הפחת מלח",
    increaseSalt: "הוסף מלח",
  },
  schedule: {
    title: "מתי הלחם צריך להיות מוכן?",
    subtitle:
      "בחרו שעת סיום אפייה — נבנה לוח זמני האפייה עם האכלת מחמצת והתפחות.",
    accordion: {
      presets: "מועדים מהירים",
      presetsHint: "בחרו כרטיס — לוח האפייה ייפתח אוטומטית",
      adjustments: "התאמות ללוח",
      adjustmentsHint: "מזג אוויר, טמפרטורת החדר וחלונות חסומים",
      timeline: "לוח זמני האפייה",
      timelineHint: "שלבים, תזכורות והזכר לי בזמן",
      interactiveDay: "תצוגת יום אינטראקטיבית",
      summary: "סיכום",
    },
    noOptions:
      "אין מועדים מתאימים בזמן שנשאר. השתמשו בזמן מותאם אישית או קיצרו את ההתפחה במקרר.",
    customTime: "מועד אפייה מותאם אישית",
    customBakeLabel: "סיום אפייה (יעד)",
    showPlan: "בניית לוח לזמן זה",
    planFooter:
      "התכנון מבוסס על {starter}% מחמצת, {autolyse} שעות עד מנוחה ראשונית, {temp}°C — הזמנים הותאמו לטמפרטורת החדר.",
    fullPlan: "התוכנית המלאה",
    startFeed: "התחלה — האכלת המחמצת לפני האפייה",
    bakeTarget: "סיום אפייה (יעד)",
    totalHours: "סה״כ ~{hours} שעות מההאכלה ועד האפייה",
    bulkHours: "התפחה ראשונה (בקערה) ~{hours} שעות",
    selectPrompt: "בחרו מועד למעלה כדי לראות שלבים ותזכורות",
    selected: "נבחר",
    express: "מואץ",
    readyAt: "לחם מוכן: {time}",
  },
  results: {
    emptyTitle: "בואו נאפה לחם מושלם",
    emptyBody:
      "הזינו את הנתונים מימין (במובייל: «התאמה») ולחצו «צור מתכון עכשיו» — כאן יופיעו הקמח, המים והמחמצת בגרמים.",
    emptyBodyDesktop:
      "הזינו את הנתונים מימין ולחצו «צור מתכון עכשיו» — כאן יופיעו הקמח, המים והמחמצת בגרמים.",
    flour: "קמח",
    water: "מים",
    starter: "מחמצת",
    salt: "מלח",
    trueHydration: "כמה נוזלים באמת בבצק",
    flourSplit: "חלוקת קמח",
  },
} as const;
