/** Adaptive schedule engine & blackout UI copy. */
export const SCHEDULING_HE = {
  blackouts: {
    sleep: "שינה",
    work: "עסוק/ים",
    custom: "חלון חסום",
    addAria: "הוסף חלון חסום",
    nameAria: "שם החלון",
    deleteAria: "מחק {label}",
    editorTitle: "חלונות חסומים",
    editorHint:
      "שלבי עבודה פעילים (האכלה, אוטוליזה, התפחה בקערה, קיפולים, עיצוב) לא יתוזמנו בתוך החלונות האלה.",
  },
  adaptations: {
    bakeShift: {
      title: "הזזנו את מועד האפייה",
      message: "מועד האפייה הוזז ב־{minutes} דקות כדי לצאת מחלונות חסומים.",
    },
    doughTempBypass: {
      title: "התאמת טמפרטורת בצק לחלון פנוי",
      messageLower:
        "כדי לדחות עיצוב מקדים לאחר «{blackout}» (~{freeTime}): הורידו את טמפרטורת הבצק ל־{temp}°C (מ־{baseTemp}°C) — התפחה ראשונית בקערה תתארך ל־{targetBulk} שעות במקום {baseBulk}.",
      messageRaise:
        "כדי להקדים עיצוב: העלו את טמפרטורת הבצק ל־{temp}°C — התפחה בקערה תתקצר ל־{targetBulk} שעות.",
      messageSame:
        "שמרו על טמפרטורת בצק ~{temp}°C — התפחה בקערה ~{targetBulk} שעות.",
    },
    starterBypass: {
      title: "התאמת שיעור חיוב במקום טמפרטורה",
      message:
        "טמפרטורת בצק מחושבת ({temp}°C) מחוץ לטווח הבטוח ({min}°C–{max}°C). כדי לדחות עיצוב לאחר «{blackout}» (~{freeTime}), שנו שיעור חיוב מ־{current}% ל־{suggested}% (התפחה בקערה ~{targetBulk} שעות).",
    },
    preshapeSnap: {
      title: "עיצוב מקדים הוזז לחלון פנוי",
      message:
        "«{block}» הוזז ל־{time} כדי לצאת מ«{blackout}».",
    },
    unresolved: {
      title: "לא נמצא פתרון אוטומטי מלא",
      message:
        "נסו להזיז את מועד האפייה, לקצר חלון חסום, להפעיל מצב מואץ, או לגרור בלוקים בציר הזמן.",
    },
    dragApplied: {
      title: "לוח עודכן",
      message: "הבלוק «{block}» הוזז ל־{time}. אפייה: {bakeEnd}.",
    },
    dragBulkLength: {
      title: "אורך התפחה בקערה השתנה",
      message: "התפחה בקערה {hours} שעות (לפני {before}).",
    },
    dragInfeasibleTitle: "גרירה לא אפשרית",
    dragInfeasibleStarter: "מרווח קצר מדי בין האכלה לאוטוליזה.",
    dragInfeasibleBulk: "התפחה בקערה קצרה מדי (מינימום ~2 שעות).",
    dragTooEarlyTitle: "מוקדם מדי",
    dragTooEarly: "האכלת המחמצת תהיה לפני {time} — בחרו שעה מאוחרת יותר.",
  },
  banner: {
    conflict:
      "יש התנגשות עם חלונות חסומים — עדכנו חלונות, גררו בלוקים, או עקבו אחרי ההמלצות למטה.",
  },
  timeline: {
    dragHint: "גררו בלוקים פעילים לשינוי מועד — האפייה תתעדכן.",
    hourAxis: "ציר שעות",
  },
} as const;
