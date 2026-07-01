const axios = require("axios");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.google.com/",
};

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
          source: "TimesJobs",
          postedDate: p.datePosted || "Recently",
          url: p.url || pageUrl,
        });
      });
    } catch (_) {}
  }
  return jobs;
}

async function scrape(role, location) {
  const url = `https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=${encodeURIComponent(role)}&txtLocation=${encodeURIComponent(location)}`;
  try {
    const { data } = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      maxContentLength: 3 * 1024 * 1024,
    });
    const jobs = extractJsonLd(data, location, url);
    console.log(`[TimesJobs] ${jobs.length} jobs for "${role}" in "${location}"`);
    return jobs;
  } catch (err) {
    console.error(`[TimesJobs] Error for ${role} in ${location}:`, err.message);
    return [];
  }
}

module.exports = { scrape };
