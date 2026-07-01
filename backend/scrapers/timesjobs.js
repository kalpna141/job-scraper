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
  const url = `https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=${encodeURIComponent(role)}&txtLocation=${encodeURIComponent(location)}`;

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    $("li.clearfix").filter((_, el) => $(el).find("h2").length > 0).each((_, el) => {
      const $el = $(el);
      const title = $el.find("h2 a").first().text().trim();
      const company = $el.find(".joblist-comp-name, .comp-dtls-wrap strong").first().text().trim();
      const experience = $el.find(".srp-skills, .job-skills").first().text().trim();
      const loc = $el.find(".loc span").first().text().trim();
      const salary = $el.find(".jd-salary, .ctc").first().text().trim();
      const posted = $el.find(".sim-posted span").first().text().trim();
      const href = $el.find("h2 a").first().attr("href") || url;

      if (title && company) {
        jobs.push({
          title,
          company,
          experience: experience || "Not specified",
          location: loc || location,
          salary: salary || "Not Disclosed",
          source: "TimesJobs",
          postedDate: posted || "Recently",
          url: href.startsWith("http") ? href : `https://www.timesjobs.com${href}`,
        });
      }
    });

    console.log(`[TimesJobs] ${jobs.length} jobs for "${role}" in "${location}"`);
  } catch (err) {
    console.error(`[TimesJobs] Error for ${role} in ${location}:`, err.message);
  }

  return jobs;
}

module.exports = { scrape };
