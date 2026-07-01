const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.google.com/",
};

async function scrape(role, location) {
  const jobs = [];
  const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(role)}&l=${encodeURIComponent(location)}&fromage=30`;

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
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
              experience: "Not specified",
              location: p.jobLocation?.address?.addressLocality || location,
              salary: "Not Disclosed",
              source: "Indeed",
              postedDate: p.datePosted || "Recently",
              url: p.url || url,
            });
          }
        });
      } catch (_) {}
    });

    // HTML fallback
    if (jobs.length === 0) {
      $(".job_seen_beacon, .tapItem").each((_, el) => {
        const $el = $(el);
        const titleEl = $el.find("h2.jobTitle span");
        const title = titleEl.attr("title") || titleEl.text().trim();
        const company = $el.find("[data-testid='company-name'], .companyName").first().text().trim();
        const loc = $el.find("[data-testid='text-location'], .companyLocation").first().text().trim();
        const salary = $el.find(".salary-snippet, .estimated-salary").first().text().trim();
        const posted = $el.find(".date, [data-testid='myJobsStateDate']").first().text().trim();
        const href = $el.find("h2.jobTitle a").first().attr("href") || "";

        if (title && company) {
          jobs.push({
            title,
            company,
            experience: "Not specified",
            location: loc || location,
            salary: salary || "Not Disclosed",
            source: "Indeed",
            postedDate: posted || "Recently",
            url: href.startsWith("http") ? href : `https://in.indeed.com${href}`,
          });
        }
      });
    }

    console.log(`[Indeed] ${jobs.length} jobs for "${role}" in "${location}"`);
  } catch (err) {
    console.error(`[Indeed] Error for ${role} in ${location}:`, err.message);
  }

  return jobs;
}

module.exports = { scrape };
