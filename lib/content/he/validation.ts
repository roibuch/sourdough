/** Form validation — educational guardrails. */
export const VALIDATION_HE = {
  totalWeight: {
    required: "כתבו כמה בצק תרצו בסוף (בגרמים) — למשל 800 לכיכר אחד.",
    tooHigh:
      "משקל גבוה מאוד — ודאו שהמספר בגרמים (למשל 800 ולא 8000).",
  },
  waterPct: {
    hard: "אחוז הנוזלים {value}% — צריך להיות בין {min}% ל־{max}%.",
    soft: "אחוז הנוזלים {value}% — ללחם ביתי נוח בדרך כלל {min}%–{max}%.",
  },
  starterPct: {
    hard: "כמות המחמצת {value}% — צריך להיות בין {min}% ל־{max}%.",
    soft: "כמות המחמצת {value}% — לסוף שבוע בדרך כלל {min}%–{max}% (תלוי בחום ובזמן).",
  },
  saltPct: {
    hard: "מלח {value}% — צריך להיות בין {min}% ל־{max}% ממשקל הקמח.",
    soft: "מלח {value}% — בדרך כלל {min}%–{max}% ממשקל הקמח.",
  },
  flourTotal: {
    over: "סך הקמחים {total}% — חייב להיות בדיוק 100%.",
    under: "סך הקמחים {total}% — חייב להיות בדיוק 100%.",
  },
  calculateBlocked: "תקנו את השדות המסומנים לפני «יצירת מתכון».",
  customFlourNote:
    "עריכה ידנית: סך הקמחים {total}%. בלחיצה על «יצירת מתכון» יואזן ל־100%.",
} as const;
