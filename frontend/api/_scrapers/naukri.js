const axios = require("axios");

// Naukri's internal JSON API — returns structured data directly, no HTML parsing needed.
// appid/systemid 109 are public identifiers used by the Naukri web app.
const API_HEADERS = {
  "appid": "109",
  "systemid": "109",
  "Content-Type": "application/json",
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Referer": "https://www.naukri.com/",
};

function toSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

function parseSalary(label) {
  if (!label || label.includes("Not")) return "Not Disclosed";
  // "8,00,000 - 12,00,000 PA." → "8-12 LPA"
  const m = label.match(/(\d[\d,]+)\s*-\s*(\d[\d,]+)/);
  if (m) {
    const min = Math.round(parseInt(m[1].replace(/,/g, "")) / 100000);
    const max = Math.round(parseInt(m[2].replace(/,/g, "")) / 100000);
    if (min > 0 && max > 0) return `${min}-${max} LPA`;
  }
  return label;
}

async function scrape(role, location) {
  const seoKey = location && location !== "all"
    ? `${toSlug(role)}-jobs-in-${toSlug(location)}`
    : `${toSlug(role)}-jobs`;

  const params = {
    noOfResults: 20,
    urlType: "search_by_keyword",
    searchType: "adv",
    keyword: role,
    pageNo: 1,
    seoKey,
  };
  if (location && location !== "all") params.location = location;

  try {
    const { data } = await axios.get("https://www.naukri.com/jobapi/v3/search", {
      params,
      headers: API_HEADERS,
      timeout: 8000,
      maxContentLength: 3 * 1024 * 1024,
    });

    const jobs = data.jobDetails || [];
    const result = jobs.map((job) => {
      const ph = job.placeholders || [];
      const locLabel = ph.find((p) => p.type === "location")?.label || location || "";
      const salLabel = ph.find((p) => p.type === "salary")?.label || "";
      return {
        title: job.title || "Untitled",
        company: job.companyName || "Unknown",
        experience: job.experienceText || "Not specified",
        location: locLabel,
        salary: parseSalary(salLabel),
        source: "Naukri",
        postedDate: job.footerPlaceholderLabel || "Recently",
        url: job.jdURL
          ? (job.jdURL.startsWith("http") ? job.jdURL : `https://www.naukri.com${job.jdURL}`)
          : "https://www.naukri.com",
      };
    });

    console.log(`[Naukri] ${result.length} jobs for "${role}" in "${location}"`);
    return result;
  } catch (err) {
    console.error(`[Naukri] Error:`, err.message);
    return [];
  }
}

module.exports = { scrape };
