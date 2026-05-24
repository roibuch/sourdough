/** לוחות זמנים מוכנים והדגשות */
export const SCHEDULE_HE = {
  highlights: {
    starter: {
      icon: "🦠",
      label: "התחילו — האכלת מחמצת",
      kind: "start" as const,
    },
    autolyse: {
      icon: "🥣",
      label: "אוטוליזה וערבוב",
      kind: "active" as const,
    },
    bulk: {
      icon: "👐",
      label: "עבודה פעילה (קיפולים)",
      kind: "active" as const,
    },
    free: {
      icon: "😴",
      label: "פנויים — מקרר בלבד",
      kind: "free" as const,
    },
    finish: {
      icon: "🔥",
      label: "לחם מוכן",
      kind: "finish" as const,
    },
  },
  candidates: {
    friEvening: "שישי אחה״צ — ארוחת שבת",
    satMorning: "שבת בבוקר — כיכר לקפה",
    satLunch: "שבת בצהריים",
    satAfternoon: "שבת אחר הצהריים",
    sunBrunch: "ראשון — בוקר/בראנץ׳",
    sunLunch: "ראשון בצהריים",
    tomorrowAm: "מחר בבוקר",
    tomorrowNoon: "מחר בצהריים",
  },
  expressSuffix: " ⚡ מואץ",
  shiftedNote: " (הותאם ל־{label} — בלי עבודה בלילה)",
  infeasibleNight:
    "עבודה פעילה יוצאת משעות {start}:00–{end}:00 — נסו מועד מאוחר יותר או «מואץ».",
  infeasibleExpress: "גם במצב מואץ נדרשות לפחות {hours} שעות מראש",
  infeasibleStandard:
    "נדרשות לפחות {hours} שעות — נסו את גרסת «מואץ»",
  bulkDetail: "מ־{start} · ~{hours} שעות",
  freeDetail: "מ־{start}",
} as const;
