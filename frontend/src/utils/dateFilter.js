export function parseDaysAgo(postedDate) {
  if (!postedDate) return null;
  const s = postedDate.toLowerCase().trim();

  if (
    s === "today" ||
    s === "just now" ||
    s === "just posted" ||
    s === "recently posted" ||
    s.includes("hour") ||
    s.includes("minute")
  ) return 0;

  if (s === "yesterday") return 1;

  const daysMatch = s.match(/(\d+)\+?\s*day/);
  if (daysMatch) return parseInt(daysMatch[1]);

  const weeksMatch = s.match(/(\d+)\+?\s*week/);
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7;

  const monthsMatch = s.match(/(\d+)\+?\s*month/);
  if (monthsMatch) return parseInt(monthsMatch[1]) * 30;

  // Formatted date like "06/01/2026"
  const dateMatch = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const parsed = new Date(postedDate);
    if (!isNaN(parsed)) {
      const diffMs = Date.now() - parsed.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // ISO date like "2026-06-28T..."
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parsed = new Date(postedDate);
    if (!isNaN(parsed)) {
      const diffMs = Date.now() - parsed.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // "recently" or unknown — don't exclude, return null
  return null;
}

export function matchesDateFilter(postedDate, maxDays) {
  if (maxDays === null) return true; // "All time"
  const days = parseDaysAgo(postedDate);
  if (days === null) return true; // can't determine, don't exclude
  return days <= maxDays;
}
