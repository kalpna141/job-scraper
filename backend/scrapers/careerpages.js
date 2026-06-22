const { newPage } = require("../browser");
const { COMPANIES } = require("../data/companies");
const { sleep } = require("../config");

const BATCH_SIZE = 8;
const FETCH_TIMEOUT_MS = 12000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function matchesRole(title, role) {
  const t = title.toLowerCase();
  const keywords = role.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return keywords.some((kw) => t.includes(kw));
}

function matchesLocation(loc, location) {
  if (!location || location === "all") return true;
  if (!loc) return false;
  return loc.toLowerCase().includes(location.toLowerCase());
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

// ── Greenhouse ────────────────────────────────────────────────────────────────

async function scrapeGreenhouse(company, role, location) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const data = await res.json();
  const jobs = data.jobs || [];

  return jobs
    .filter((j) => matchesRole(j.title, role) && matchesLocation(j.location?.name, location))
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
  const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json&limit=250`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const jobs = await res.json();

  return jobs
    .filter(
      (j) =>
        matchesRole(j.text, role) &&
        matchesLocation(j.categories?.location || j.workplaceType, location)
    )
    .map((j) => ({
      title: j.text,
      company: company.name,
      experience: "N/A",
      location: j.categories?.location || j.workplaceType || location,
      source: "Career Pages",
      postedDate: j.createdAt
        ? new Date(j.createdAt).toLocaleDateString("en-IN")
        : "Recently",
      url: j.hostedUrl || `https://jobs.lever.co/${company.slug}`,
    }));
}

// ── Workday ───────────────────────────────────────────────────────────────────

// Workday tenants expose a search API but the exact subdomain varies.
// We try the two most common URL patterns.
const WORKDAY_PATTERNS = [
  (tenant) => `https://${tenant}.wd5.myworkdayjobs.com/wday/cxs/${tenant}/External_Careers/jobs`,
  (tenant) => `https://${tenant}.wd3.myworkdayjobs.com/wday/cxs/${tenant}/Careers/jobs`,
];

async function scrapeWorkday(company, role, location) {
  const body = JSON.stringify({
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText: role,
  });

  for (const pattern of WORKDAY_PATTERNS) {
    try {
      const url = pattern(company.tenant);
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) continue;
      const data = await res.json();
      const jobs = data.jobPostings || [];

      return jobs
        .filter((j) => matchesLocation(j.locationsText, location))
        .map((j) => ({
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
    } catch (_) {
      // try next pattern
    }
  }
  return [];
}

// ── Custom (Puppeteer) ────────────────────────────────────────────────────────

async function scrapeCustom(company, role, location) {
  let page;
  try {
    const url = (company.searchUrl || company.careersUrl)
      .replace("{role}", encodeURIComponent(role))
      .replace("{location}", encodeURIComponent(location));

    page = await newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });

    if (company.selector) {
      await page.waitForSelector(company.selector, { timeout: 8000 }).catch(() => {});
    }

    const rawJobs = await page.evaluate((cfg) => {
      const cards = document.querySelectorAll(cfg.selector || ".job, .position, .opening, li[data-job]");
      return Array.from(cards).slice(0, 30).map((el) => ({
        title: cfg.titleSel
          ? el.querySelector(cfg.titleSel)?.innerText?.trim()
          : el.querySelector("h2,h3,h4,a")?.innerText?.trim(),
        location: cfg.locationSel
          ? el.querySelector(cfg.locationSel)?.innerText?.trim()
          : el.querySelector(".location,.city,.place")?.innerText?.trim(),
        href: el.querySelector("a")?.href || "",
      }));
    }, company);

    return rawJobs
      .filter((j) => j.title && matchesRole(j.title, role))
      .filter((j) => matchesLocation(j.location, location))
      .map((j) => ({
        title: j.title,
        company: company.name,
        experience: "N/A",
        location: j.location || location,
        source: "Career Pages",
        postedDate: "Recently",
        url: j.href || company.careersUrl || company.searchUrl,
      }));
  } catch (err) {
    console.error(`[CareerPages] Custom scrape failed for ${company.name}:`, err.message);
    return [];
  } finally {
    if (page) await page.close();
  }
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

async function scrape(role, location) {
  console.log(`[CareerPages] Searching ${COMPANIES.length} company pages for "${role}" in "${location}"`);
  const allJobs = [];

  // Process in batches to avoid hammering all APIs simultaneously
  for (let i = 0; i < COMPANIES.length; i += BATCH_SIZE) {
    const batch = COMPANIES.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((company) => scrapeCompany(company, role, location))
    );
    results.forEach((r) => {
      if (r.status === "fulfilled") allJobs.push(...r.value);
    });
  }

  console.log(`[CareerPages] Found ${allJobs.length} jobs from career pages`);
  return allJobs;
}

module.exports = { scrape };
