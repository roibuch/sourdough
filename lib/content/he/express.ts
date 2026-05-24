/** מצב מואץ, יחסי האכלה ואזורי חימום */
export const EXPRESS_HE = {
  starterRatios: [
    {
      id: "auto" as const,
      label: "אוטומטי",
      ratioLabel: "לפי זמן",
      typicalPeakHours: 5,
      note: "המערכת בוחרת יחס לפי השעות עד האוטוליזה.",
    },
    {
      id: "equal" as const,
      label: "1:1:1",
      ratioLabel: "1 : 1 : 1",
      typicalPeakHours: 3.5,
      note: "האכלה קטנה ומהירה — מגיעה לשיא בכ־3–4 שעות בחום.",
    },
    {
      id: "half" as const,
      label: "1:0.5:0.5",
      ratioLabel: "1 : 0.5 : 0.5",
      typicalPeakHours: 2.5,
      note: "האכלה מינימלית — הכי מהיר, דורש מחמצת חזקה.",
    },
    {
      id: "peak" as const,
      label: "בשיא מהצנצנת",
      ratioLabel: "ללא האכלה",
      typicalPeakHours: 0.5,
      note: "רק אם יש מספיק מחמצת פעילה בצנצנת — בלי האכלה נוספת.",
    },
  ],
  warmZones: {
    microwave: {
      id: "microwave-off" as const,
      title: "מיקרוגל כבוי",
      targetTemp: "28–32°C",
      steps: [
        "שימו את המחמצת בקערה מכוסה בתוך המיקרוגל — **המיקרוגל כבוי לחלוטין**.",
        "סגרו את הדלת — יוצר תא חם ולח ללא חום ישיר.",
        "בדקו נפח כל 45–60 דקות.",
      ],
      warning: "לא להדליק מיקרוגל! רק שימוש כמחסן חם.",
    },
    ovenLight: {
      id: "oven-light" as const,
      title: "תנור — נורה בלבד",
      targetTemp: "26–30°C",
      steps: [
        "הדליקו **רק** את נורת התנור (בלי חום / בלי טורבו).",
        "שימו קערה מכוסה על המדף האמצעי.",
        "אם חם מדי מעל 32°C — פתחו מעט את הדלת.",
      ],
    },
    warmCorner: {
      id: "warm-corner" as const,
      title: "פינה חמה בבית",
      targetTemp: "24–26°C",
      steps: [
        "ליד תנור פועל, מעל מקרר, או חלון שמשי חלש.",
        "כיסוי הדוק על הקערה — שמרו על לחות.",
      ],
    },
  },
  summary:
    "מצב מואץ: האכלה מהירה, אוטוליזה כ־30 דק׳, התפחה ראשונית קצרה, מקרר 4–8 שעות, ומומלץ אזור חימום.",
} as const;
