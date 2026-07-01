const { newPage } = require("../browser");

function toSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

async function scrape(role, location) {
  const jobs = [];
  const url = `https://www.naukri.com/${toSlug(role)}-jobs-in-${toSlug(location)}`;
  let page;

  try {
    page = await newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for job cards to load
    await page.waitForSelector(".cust-job-tuple, .srp-jobtuple-wrapper, article", {
      timeout: 10000,
    }).catch(() => {});

    const extracted = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        ".cust-job-tuple, .srp-jobtuple-wrapper, article.jobTuple"
      );
      return Array.from(cards).map((el) => ({
        title: el.querySelector(".title, a.title, .jobTitle")?.innerText?.trim() || "",
        company: el.querySelector(".comp-name, .companyName")?.innerText?.trim() || "",
        experience: el.querySelector(".expwdth, .experience, .exp-wrap")?.innerText?.trim() || "",
        location: el.querySelector(".locWdth, .location, .loc")?.innerText?.trim() || "",
        salary: el.querySelector(".sal-wrap, .salary, [class*='salary']")?.innerText?.trim() || "",
        posted: el.querySelector(".job-post-day, .freshness")?.innerText?.trim() || "",
        href: el.querySelector("a.title, a.jobTitle")?.href || "",
      }));
    });

    extracted.forEach(({ title, company, experience, location: loc, salary, posted, href }) => {
      if (title && company) {
        jobs.push({
          title,
          company,
          experience: experience || "Not specified",
          location: loc || location,
          salary: salary || "Not Disclosed",
          source: "Naukri",
          postedDate: posted || "Recently",
          url: href || url,
        });
      }
    });
  } catch (err) {
    console.error(`[Naukri] Error for ${role} in ${location}:`, err.message);
  } finally {
    if (page) await page.close();
  }

  return jobs;
}

module.exports = { scrape };
