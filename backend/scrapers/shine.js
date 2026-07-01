const axios = require("axios");
const cheerio = require("cheerio");

function toSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.google.com/",
};

async function scrape(role, location) {
  const jobs = [];
  const url = `https://www.shine.com/job-search/${toSlug(role)}-jobs-in-${toSlug(location)}`;

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000, maxContentLength: 3 * 1024 * 1024 });
    const $ = cheerio.load(data);

    // JSON-LD first
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        const postings = Array.isArray(json) ? json : [json];
        postings.forEach((p) => {
          if (p["@type"] === "JobPosting" && p.title) {
            jobs.push({
              title: p.title,
              company: p.hiringOrganization?.name || "Unknown",
              experience: p.experienceRequirements?.value || "Not specified",
              location: p.jobLocation?.address?.addressLocality || location,
              salary: "Not Disclosed",
              source: "Shine",
              postedDate: p.datePosted || "Recently",
              url: p.url || url,
            });
          }
        });
      } catch (_) {}
    });

    // HTML fallback
    if (jobs.length === 0) {
      $(".jdbigCard, [class*='jobCard'], [class*='job-card']").each((_, el) => {
        const $el = $(el);
        const title = $el.find("h3[itemprop='name'], h2, h3").first().text().trim();
        const company = $el.find("[class*='TitleName'], [class*='company']").first().text().trim();
        const experience = $el.find("[class*='expRange'], [class*='Exp']").first().text().trim();
        const loc = $el.find("[class*='location'], [class*='Location']").first().text().trim();
        const posted = $el.find("[class*='postedData']").first().text().trim();
        const href = $el.find("a").first().attr("href") || url;

        if (title && company) {
          jobs.push({
            title,
            company,
            experience: experience || "Not specified",
            location: loc || location,
            salary: "Not Disclosed",
            source: "Shine",
            postedDate: posted || "Recently",
            url: href.startsWith("http") ? href : `https://www.shine.com${href}`,
          });
        }
      });
    }

    console.log(`[Shine] ${jobs.length} jobs for "${role}" in "${location}"`);
  } catch (err) {
    console.error(`[Shine] Error for ${role} in ${location}:`, err.message);
  }

  return jobs;
}

module.exports = { scrape };
