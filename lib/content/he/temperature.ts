/** טמפרטורה — מצב «ללא מדחום» */
export const TEMPERATURE_HE = {
  unknown: "לא ידועה",
  unknownHint:
    "נשתמש ב־{temp}°C — הערכה לטמפרטורת חדר נעימה (בלי מדחום)",
  unknownActive: "טמפרטורה לא ידועה — הערכה {temp}°C",
  estimateNote:
    "חלק מהטמפרטורות מסומנות «לא ידועות» — החישוב מבוסס על הערכת {temp}°C.",
} as const;
