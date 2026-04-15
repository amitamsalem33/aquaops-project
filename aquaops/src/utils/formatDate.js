/**
 * Formats any date string to consistent Hebrew locale format (DD/MM/YYYY).
 * Handles both ISO date-only strings ("2024-01-15") and full ISO timestamps.
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    // Avoid UTC offset shifting for date-only strings
    const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("he-IL", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return dateStr;
  }
}
