// Parse salary strings into LPA (Lakhs Per Annum).
// Returns { min, max } or null if undetermined.
export function parseSalaryLPA(str) {
  if (!str) return null;
  const raw = str.replace(/,/g, "").trim();
  const s = raw.toLowerCase();

  if (
    s.includes("not disclosed") ||
    s.includes("not mentioned") ||
    s.includes("confidential") ||
    s.includes("best in industry") ||
    s.includes("as per industry") ||
    s === "n/a" ||
    s === ""
  ) return null;

  const isMonthly = /per\s*month|\/\s*month|\bmonth\b|p\.m\b/.test(s);
  const multiplier = isMonthly ? 12 : 1;

  // ── LPA formats ──────────────────────────────────────────────────────────
  // "8-12 lpa" / "8 to 12 lpa" / "8 - 12 lpa"
  const lpaRange = s.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*lpa/);
  if (lpaRange) return { min: parseFloat(lpaRange[1]), max: parseFloat(lpaRange[2]) };

  // "8 lpa"
  const lpaSingle = s.match(/(\d+(?:\.\d+)?)\s*lpa/);
  if (lpaSingle) { const n = parseFloat(lpaSingle[1]); return { min: n, max: n }; }

  // ── Lacs / Lakhs formats ─────────────────────────────────────────────────
  const lacUnit = /la(?:c|k)(?:hs?|s)?/; // matches lac, lacs, lakh, lakhs

  // "3-5 lacs" / "3 to 5 lakhs" / "3 - 5 lacs pa"
  const lacsRangeA = s.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:to|-|–)\\s*(\\d+(?:\\.\\d+)?)\\s*${lacUnit.source}`)
  );
  if (lacsRangeA) {
    return {
      min: parseFloat(lacsRangeA[1]) * multiplier,
      max: parseFloat(lacsRangeA[2]) * multiplier,
    };
  }

  // "8 lacs - 12 lacs" (unit on both sides)
  const lacsRangeB = s.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${lacUnit.source}\\s*(?:to|-|–)\\s*(\\d+(?:\\.\\d+)?)\\s*${lacUnit.source}`)
  );
  if (lacsRangeB) {
    return {
      min: parseFloat(lacsRangeB[1]) * multiplier,
      max: parseFloat(lacsRangeB[2]) * multiplier,
    };
  }

  // "8 lacs" single
  const lacsSingle = s.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${lacUnit.source}`));
  if (lacsSingle) {
    const n = parseFloat(lacsSingle[1]) * multiplier;
    return { min: n, max: n };
  }

  // ── "L" shorthand: "3L - 5L" or "3 L - 5 L" ────────────────────────────
  const lRange = s.match(/(\d+(?:\.\d+)?)\s*l\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*l\b/);
  if (lRange) {
    return {
      min: parseFloat(lRange[1]) * multiplier,
      max: parseFloat(lRange[2]) * multiplier,
    };
  }
  const lSingle = s.match(/(\d+(?:\.\d+)?)\s*l\b/);
  if (lSingle) { const n = parseFloat(lSingle[1]) * multiplier; return { min: n, max: n }; }

  // ── Raw rupee amounts ≥ 6 digits (avoid matching experience numbers) ─────
  // e.g. "800000 - 1200000" or "₹8,00,000 - ₹12,00,000"
  const rupeeRange = s.match(/(\d{6,})\s*(?:to|-|–)\s*(\d{6,})/);
  if (rupeeRange) {
    const min = parseFloat(rupeeRange[1]) / 100000;
    const max = parseFloat(rupeeRange[2]) / 100000;
    const annualMin = isMonthly ? min * 12 : min;
    const annualMax = isMonthly ? max * 12 : max;
    return { min: annualMin, max: annualMax };
  }

  const rupeeSingle = s.match(/₹\s*(\d{5,})/); // require ₹ symbol to avoid false positives
  if (rupeeSingle) {
    const n = parseFloat(rupeeSingle[1]) / 100000;
    const annual = isMonthly ? n * 12 : n;
    return { min: annual, max: annual };
  }

  return null;
}

// Returns true if salary meets minLPA threshold.
// Jobs with disclosed salary below threshold are excluded.
// Jobs with undisclosed/unknown salary always pass.
export function matchesSalary(salaryStr, minLPA) {
  if (minLPA === null) return true;
  const parsed = parseSalaryLPA(salaryStr);
  if (!parsed) return true; // salary not disclosed — include it
  return parsed.max >= minLPA;
}

// Returns true only when salary IS known
export function hasSalaryData(salaryStr) {
  return parseSalaryLPA(salaryStr) !== null;
}
