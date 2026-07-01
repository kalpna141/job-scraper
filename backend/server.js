const express = require("express");
const cors = require("cors");
const naukri = require("./scrapers/naukri");
const indeed = require("./scrapers/indeed");
const shine = require("./scrapers/shine");
const timesjobs = require("./scrapers/timesjobs");
const careerpages = require("./scrapers/careerpages");
const { ROLES, LOCATIONS } = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
});

function logMem(label) {
  const m = process.memoryUsage();
  console.log(`[Mem:${label}] rss=${Math.round(m.rss/1e6)}MB heap=${Math.round(m.heapUsed/1e6)}/${Math.round(m.heapTotal/1e6)}MB ext=${Math.round(m.external/1e6)}MB`);
}
logMem("startup");

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
  try {
    const { role, location } = req.query;

    if (!role || !location) {
      return res.status(400).json({ error: "role and location are required" });
    }

    const locations = location === "all" ? LOCATIONS : [location];
    const roles = role === "all" ? ROLES : [role];

    console.log(
      `[Server] Searching: roles=${roles.join(", ")} | locations=${locations.join(", ")}`,
    );
    logMem("before-scrape");

    const allResults = [];

    for (const r of roles) {
      for (const l of locations) {
        const results = await Promise.allSettled([
          naukri.scrape(r, l),
          indeed.scrape(r, l),
          shine.scrape(r, l),
          timesjobs.scrape(r, l),
          careerpages.scrape(r, l),
        ]);

        results.forEach((result) => {
          if (result.status === "fulfilled") allResults.push(...result.value);
        });
      }
    }

    logMem("after-scrape");
    const deduplicated = deduplicateJobs(allResults);
    console.log(`[Server] Found ${deduplicated.length} unique jobs`);
    res.json({ jobs: deduplicated, total: deduplicated.length });
  } catch (err) {
    console.error("[Server] /api/jobs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/config", (req, res) => {
  res.json({ roles: ROLES, locations: LOCATIONS });
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () =>
  console.log(`Job scraper backend running on http://localhost:${PORT}`),
);

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
