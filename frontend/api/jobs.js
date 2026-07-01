const naukri = require("./_scrapers/naukri");
const indeed = require("./_scrapers/indeed");
const shine = require("./_scrapers/shine");
const timesjobs = require("./_scrapers/timesjobs");
const careerpages = require("./_scrapers/careerpages");

const ROLES = ["quality analyst", "mern stack developer", "react developer", "nodejs developer"];
const LOCATIONS = ["pune", "bangalore", "delhi", "gurgaon", "noida", "chandigarh", "remote"];

function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { role, location } = req.query;
  if (!role || !location) {
    return res.status(400).json({ error: "role and location are required" });
  }

  const locations = location === "all" ? LOCATIONS : [location];
  const roles = role === "all" ? ROLES : [role];

  console.log(`[Jobs] Searching: roles=${roles.join(", ")} | locations=${locations.join(", ")}`);

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

  const deduplicated = deduplicateJobs(allResults);
  console.log(`[Jobs] Found ${deduplicated.length} unique jobs`);
  res.json({ jobs: deduplicated, total: deduplicated.length });
};
