const axios = require("axios");
const { COMPANIES } = require("../data/companies");

const BATCH_SIZE = 3;
const TIMEOUT_MS = 10000;
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB per API call — prevents buffering huge responses
const MAX_JOBS_PER_COMPANY = 20;

function matchesRole(title, role) {
  const t = title.toLowerCase();
  return role.toLowerCase().split(/\s+/).filter((w) => w.length > 2).some((kw) => t.includes(kw));
}

function matchesLocation(loc, location) {
  if (!location || location === "all") return true;
  if (!loc) return false;
  return loc.toLowerCase().includes(location.toLowerCase());
}

// ── Greenhouse ────────────────────────────────────────────────────────────────

async function scrapeGreenhouse(company, role, location) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs`;
  const { data } = await axios.get(url, { timeout: TIMEOUT_MS, maxContentLength: MAX_BYTES });
  return (data.jobs || [])
    .filter((j) => matchesRole(j.title, role) && matchesLocation(j.location?.name, location))
    .slice(0, MAX_JOBS_PER_COMPANY)
    .map((j) => ({
      title: j.title,
      company: company.name,
      experience: "N/A",
      location: j.location?.name || location,
      source: "Career Pages",
      postedDate: j.updated_at ? new Date(j.updated_at).toLocaleDateString("en-IN") : "Recently",
      url: j.absolute_url || `https://boards.greenhouse.io/${company.slug}`,
    }));
}

// ── Lever ─────────────────────────────────────────────────────────────────────

async function scrapeLever(company, role, location) {
  const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json&limit=20`;
  const { data } = await axios.get(url, { timeout: TIMEOUT_MS, maxContentLength: MAX_BYTES });
  return (Array.isArray(data) ? data : [])
    .filter((j) => matchesRole(j.text, role) && matchesLocation(j.categories?.location, location))
    .slice(0, MAX_JOBS_PER_COMPANY)
    .map((j) => ({
      title: j.text,
      company: company.name,
      experience: "N/A",
      location: j.categories?.location || location,
      source: "Career Pages",
      postedDate: j.createdAt ? new Date(j.createdAt).toLocaleDateString("en-IN") : "Recently",
      url: j.hostedUrl || `https://jobs.lever.co/${company.slug}`,
    }));
}

// ── Workday ───────────────────────────────────────────────────────────────────

const WORKDAY_PATTERNS = [
  (t) => `https://${t}.wd5.myworkdayjobs.com/wday/cxs/${t}/External_Careers/jobs`,
  (t) => `https://${t}.wd3.myworkdayjobs.com/wday/cxs/${t}/Careers/jobs`,
];

async function scrapeWorkday(company, role, location) {
  const body = JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: role });
  for (const pattern of WORKDAY_PATTERNS) {
    try {
      const { data } = await axios.post(pattern(company.tenant), body, {
        headers: { "Content-Type": "application/json" },
        timeout: TIMEOUT_MS,
        maxContentLength: MAX_BYTES,
      });
      const jobs = (data.jobPostings || []).filter((j) => matchesLocation(j.locationsText, location));
      if (jobs.length === 0 && data.jobPostings) return [];
      return jobs.slice(0, MAX_JOBS_PER_COMPANY).map((j) => ({
        title: j.title,
        company: company.name,
        experience: "N/A",
        location: j.locationsText || location,
        source: "Career Pages",
        postedDate: j.postedOn || "Recently",
        url: j.externalPath
          ? `https://${company.tenant}.wd5.myworkdayjobs.com${j.externalPath}`
          : `https://${company.tenant}.wd5.myworkdayjobs.com`,
      }));
    } catch (_) {}
  }
  return [];
}

// ── Custom ────────────────────────────────────────────────────────────────────

async function scrapeCustom() {
  return [];
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

async function scrapeCompany(company, role, location) {
  try {
    switch (company.ats) {
      case "greenhouse": return await scrapeGreenhouse(company, role, location);
      case "lever":      return await scrapeLever(company, role, location);
      case "workday":    return await scrapeWorkday(company, role, location);
      case "custom":     return await scrapeCustom(company, role, location);
      default:           return [];
    }
  } catch (err) {
    console.error(`[CareerPages] ${company.name} failed:`, err.message);
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

const COMPANIES_TO_SEARCH = COMPANIES.slice(0, 30);

async function scrape(role, location) {
  console.log(`[CareerPages] Searching ${COMPANIES_TO_SEARCH.length} companies for "${role}" in "${location}"`);
  const allJobs = [];

  for (let i = 0; i < COMPANIES_TO_SEARCH.length; i += BATCH_SIZE) {
    const batch = COMPANIES_TO_SEARCH.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((c) => scrapeCompany(c, role, location)));
    results.forEach((r) => {
      if (r.status === "fulfilled") allJobs.push(...r.value);
    });
  }

  console.log(`[CareerPages] Found ${allJobs.length} jobs from career pages`);
  return allJobs;
}

module.exports = { scrape };
