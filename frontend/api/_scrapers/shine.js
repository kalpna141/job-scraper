const axios = require("axios");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.google.com/",
};

function toSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

function extractJsonLd(html, location, pageUrl) {
  const jobs = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1]);
      const list = Array.isArray(json) ? json : [json];
      list.forEach((p) => {
        if (p["@type"] !== "JobPosting" || !p.title) return;
        jobs.push({
          title: p.title,
          company: p.hiringOrganization?.name || "Unknown",
          experience: p.experienceRequirements?.value || p.experienceRequirements || "Not specified",
          location: p.jobLocation?.address?.addressLocality || location,
          salary: "Not Disclosed",
          source: "Shine",
          postedDate: p.datePosted || "Recently",
          url: p.url || pageUrl,
        });
      });
    } catch (_) {}
  }
  return jobs;
}

async function scrape(role, location) {
  const url = `https://www.shine.com/job-search/${toSlug(role)}-jobs-in-${toSlug(location)}`;
  try {
    const { data } = await axios.get(url, {
      headers: HEADERS,
      timeout: 8000,
      maxContentLength: 3 * 1024 * 1024,
    });
    const jobs = extractJsonLd(data, location, url);
    console.log(`[Shine] ${jobs.length} jobs for "${role}" in "${location}"`);
    return jobs;
  } catch (err) {
    console.error(`[Shine] Error:`, err.message);
    return [];
  }
}

module.exports = { scrape };
