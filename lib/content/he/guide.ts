/** Step-by-step baking guide — approximate hours, optional deep dives. */
export const GUIDE_HE = {
  title: "מדריך אפייה לפי שעות (משוער)",
  subtitle:
    "סדר העבודה והזמנים המשוערים לפי המתכון, הקמחים והקצב שלכם — בלי לוח זמנים מדויק.",
  totalLabel: "סה״כ משוער מהאכלה ועד חיתוך",
  starterOnly:
    "מצב מחמצת בלבד — שלבי הבצק יופיעו אחרי «יצירת מתכון».",
  tuning: {
    title: "התאמות (אופציונלי)",
    pace: "קצב התפחה",
    paceStandard: "רגיל",
    paceExpress: "מואץ",
    paceHint:
      "מואץ מקצר חלונות; רגיל נותן יותר מרווח — תמיד עקבו אחרי נפח הבצק.",
    roomTemp: "טמפרטורת עבודה (°C)",
    coldRetard: "שעות במקרר",
    windowLabel: "שעות מההאכלה עד אוטוליזה",
    showDetails: "הסברים: הארכה, קמחים ועוד",
    hideDetails: "הסתר הסברים",
  },
  masses: {
    title: "כמויות לשלבים",
    autolyse: "אוטוליזה: {flour} גרם קמח + {water} גרם מים",
    fermentolyse:
      "פרמנטוליזה: {flour} גרם קמח + {water} גרם מים + {starter} גרם מחמצת",
    mix: "לישה סופית: {starter} גרם מחמצת, {salt} גרם מלח{bassinage}",
    mixFermentolyse: "אחרי המנוחה: {salt} גרם מלח{bassinage}",
    bassinage: ", ו־{hold} גרם מים (בסינאז׳)",
  },
  tipBassinage:
    "הוספת מים הדרגתית (בסינאז׳): החזיקו {hold} גרם מים להוספה עם המחמצת — שליטה טובה יותר בבצק רטוב.",
} as const;
