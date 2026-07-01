const express = require("express");
const cors = require("cors");
const naukri = require("./scrapers/naukri");
const indeed = require("./scrapers/indeed");
const shine = require("./scrapers/shine");
const timesjobs = require("./scrapers/timesjobs");
const careerpages = require("./scrapers/careerpages");
const { ROLES, LOCATIONS } = require("./config");
const { closeBrowser } = require("./browser");

const app = express();
app.use(cors());
app.use(express.json());

function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

app.get("/api/jobs", async (req, res) => {
  const { role, location } = req.query;

  if (!role || !location) {
    return res.status(400).json({ error: "role and location are required" });
  }

  const locations = location === "all" ? LOCATIONS : [location];
  const roles = role === "all" ? ROLES : [role];

  console.log(
    `[Server] Searching: roles=${roles.join(", ")} | locations=${locations.join(", ")}`,
  );

  const allResults = [];

  // Run Puppeteer scrapers sequentially and close browser between each
  // to stay within Render free tier 512MB memory limit
  const puppeteerScrapers = [
    { name: "Naukri", scraper: naukri },
    { name: "Indeed", scraper: indeed },
    { name: "Shine", scraper: shine },
    { name: "TimesJobs", scraper: timesjobs },
  ];

  for (const r of roles) {
    for (const l of locations) {
      for (const { name, scraper } of puppeteerScrapers) {
        try {
          const jobs = await scraper.scrape(r, l);
          allResults.push(...jobs);
          console.log(`[${name}] ${jobs.length} jobs found`);
        } catch (err) {
          console.error(`[${name}] failed:`, err.message);
        } finally {
          await closeBrowser(); // free Chrome memory after each site
        }
      }

      // CareerPages uses HTTP APIs (no Chrome) — run normally
      try {
        const jobs = await careerpages.scrape(r, l);
        allResults.push(...jobs);
      } catch (err) {
        console.error(`[CareerPages] failed:`, err.message);
      }
    }
  }

  const deduplicated = deduplicateJobs(allResults);
  console.log(`[Server] Found ${deduplicated.length} unique jobs`);
  res.json({ jobs: deduplicated, total: deduplicated.length });
});

app.get("/api/config", (req, res) => {
  res.json({ roles: ROLES, locations: LOCATIONS });
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () =>
  console.log(`Job scraper backend running on http://localhost:${PORT}`),
);

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});
