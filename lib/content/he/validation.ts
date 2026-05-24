/** Form validation — educational guardrails. */
export const VALIDATION_HE = {
  totalWeight: {
    required: "הזינו משקל בצק סופי חיובי (גרם) — המשקל שאתם רוצים אחרי אפייה.",
    tooHigh:
      "משקל גבוה מאוד — ודאו שהערך בגרם (למשל 800 ולא 8000).",
  },
  waterPct: {
    hard: "אחוז הידרציה {value}% — חייב להיות בין {min}% ל־{max}%.",
    soft: "אחוז הידרציה {value}% — בלחמי מחמצת ארטיזנליים הטווח הנוח בדרך כלל {min}%–{max}%.",
  },
  starterPct: {
    hard: "שיעור חיוב {value}% — חייב להיות בין {min}% ל־{max}%.",
    soft: "שיעור חיוב {value}% — לסוף שבוע טיפוסי {min}%–{max}% (התאימו לטמפ׳ ולזמן).",
  },
  saltPct: {
    hard: "מלח {value}% — חייב להיות בין {min}% ל־{max}% ממשקל הקמח.",
    soft: "מלח {value}% — סטנדרט מקצועי בדרך כלל {min}%–{max}% (מבוסס קמח).",
  },
  flourTotal: {
    over: "סך הקמחים {total}% — מעל 100%. אחוזי הקמח חייבים להסתכם בדיוק ל־100%.",
    under: "סך הקמחים {total}% — מתחת ל־100%. אחוזי הקמח חייבים להסתכם בדיוק ל־100%.",
  },
  calculateBlocked: "תקנו את השדות המסומנים לפני חישוב המרכיבים.",
  customFlourNote: "עריכה ידנית: סך הקמחים {total}%. יש להגיע בדיוק ל־100%.",
} as const;
