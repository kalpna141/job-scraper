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
    // Career pages searched once per role with the original location param.
    // Passing "all" lets matchesLocation include every job regardless of city.
    // Passing a specific city keeps the filter tight.
    const careerPromise = careerpages.scrape(r, location);

    for (const l of locations) {
      const [naukriR, indeedR, shineR, timesjobsR] = await Promise.allSettled([
        naukri.scrape(r, l),
        indeed.scrape(r, l),
        shine.scrape(r, l),
        timesjobs.scrape(r, l),
      ]);
      [naukriR, indeedR, shineR, timesjobsR].forEach((result) => {
        if (result.status === "fulfilled") allResults.push(...result.value);
      });
    }

    // Await career pages after the HTML scrapers finish
    try {
      const careerJobs = await careerPromise;
      allResults.push(...careerJobs);
    } catch (_) {}
  }

  const deduplicated = deduplicateJobs(allResults);
  console.log(`[Jobs] Found ${deduplicated.length} unique jobs`);
  res.json({ jobs: deduplicated, total: deduplicated.length });
};
