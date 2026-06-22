// Parse experience strings like "3-5 Yrs", "2 to 4 years", "3+ years", "Fresher" etc.
// Returns { min, max } in years, or null if unparseable.
export function parseExperience(str) {
  if (!str || str === "Not specified" || str === "N/A") return null;
  const s = str.toLowerCase();

  // Fresher / entry level
  if (/fresher|entry|0\s*year/.test(s)) return { min: 0, max: 0 };

  // "3-5 yrs" or "3 to 5 years"
  const rangeMatch = s.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };

  // "3+ years" or "3 years"
  const singleMatch = s.match(/(\d+)\s*\+?/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1]);
    return { min: n, max: n + 2 };
  }

  return null;
}

// Returns true if job's experience overlaps with [wantMin, wantMax]
export function matchesExperience(expStr, wantMin, wantMax) {
  const parsed = parseExperience(expStr);
  if (!parsed) return true; // can't determine — include it
  // Overlap check: ranges overlap if jobMin <= wantMax && jobMax >= wantMin
  return parsed.min <= wantMax && parsed.max >= wantMin;
}

// Default experience range per role
export function defaultExpRange(role) {
  if (!role || role === "all") return { min: 0, max: 10 };
  if (role.includes("quality analyst")) return { min: 3, max: 5 };
  return { min: 2, max: 3 };
}
