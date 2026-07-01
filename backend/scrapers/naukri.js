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
  "Cache-Control": "no-cache",
  "Referer": "https://www.google.com/",
};

async function scrape(role, location) {
  const jobs = [];
  const url = `https://www.naukri.com/${toSlug(role)}-jobs-in-${toSlug(location)}`;

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000, maxContentLength: 3 * 1024 * 1024 });
    const $ = cheerio.load(data);

    // Try JSON-LD structured data first (most reliable, used for SEO)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        const postings = Array.isArray(json) ? json : [json];
        postings.forEach((p) => {
          if (p["@type"] === "JobPosting" && p.title) {
            jobs.push({
              title: p.title,
              company: p.hiringOrganization?.name || "Unknown",
              experience: "Not specified",
              location: p.jobLocation?.address?.addressLocality || location,
              salary: "Not Disclosed",
              source: "Naukri",
              postedDate: p.datePosted || "Recently",
              url: p.url || url,
            });
          }
        });
      } catch (_) {}
    });

    // HTML fallback
    if (jobs.length === 0) {
      $(".cust-job-tuple, .srp-jobtuple-wrapper, article.jobTuple").each((_, el) => {
        const $el = $(el);
        const title = $el.find(".title, a.title, .jobTitle").first().text().trim();
        const company = $el.find(".comp-name, .companyName").first().text().trim();
        const experience = $el.find(".expwdth, .experience, .exp-wrap").first().text().trim();
        const loc = $el.find(".locWdth, .location, .loc").first().text().trim();
        const salary = $el.find(".sal-wrap, .salary").first().text().replace(/\s+/g, " ").trim();
        const posted = $el.find(".job-post-day, .freshness").first().text().trim();
        const href = $el.find("a.title, a.jobTitle").first().attr("href") || url;

        if (title && company) {
          jobs.push({
            title,
            company,
            experience: experience || "Not specified",
            location: loc || location,
            salary: salary || "Not Disclosed",
            source: "Naukri",
            postedDate: posted || "Recently",
            url: href.startsWith("http") ? href : `https://www.naukri.com${href}`,
          });
        }
      });
    }

    console.log(`[Naukri] ${jobs.length} jobs for "${role}" in "${location}"`);
  } catch (err) {
    console.error(`[Naukri] Error for ${role} in ${location}:`, err.message);
  }

  return jobs;
}

module.exports = { scrape };
