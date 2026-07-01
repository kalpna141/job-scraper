const { newPage } = require("../browser");

async function scrape(role, location) {
  const jobs = [];
  const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(role)}&l=${encodeURIComponent(location)}`;
  let page;

  try {
    page = await newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForSelector(".job_seen_beacon", { timeout: 10000 }).catch(() => {});

    const extracted = await page.evaluate(() => {
      const cards = document.querySelectorAll(".job_seen_beacon");
      return Array.from(cards).map((el) => {
        const titleSpan = el.querySelector("h3.jobTitle span[title], h3.jobTitle span[id]");
        const linkEl = el.querySelector("h3.jobTitle a");
        const href = linkEl?.getAttribute("href") || "";
        return {
          title: titleSpan?.getAttribute("title") || titleSpan?.innerText?.trim() || "",
          company: el.querySelector("[data-testid='company-name']")?.innerText?.trim() || "",
          location: el.querySelector("[data-testid='text-location']")?.innerText?.trim() || "",
          salary: el.querySelector(".salary-snippet, [data-testid='attribute_snippet_testid'], .estimated-salary")?.innerText?.trim() || "",
          posted: el.querySelector(".date, [data-testid='myJobsStateDate']")?.innerText?.trim() || "",
          href: href.startsWith("http") ? href : `https://in.indeed.com${href}`,
        };
      });
    });

    extracted.forEach(({ title, company, location: loc, salary, posted, href }) => {
      if (title && company) {
        jobs.push({
          title,
          company,
          experience: "Not specified",
          location: loc || location,
          salary: salary || "Not Disclosed",
          source: "Indeed",
          postedDate: posted || "Recently",
          url: href || url,
        });
      }
    });
  } catch (err) {
    console.error(`[Indeed] Error for ${role} in ${location}:`, err.message);
  } finally {
    if (page) await page.close();
  }

  return jobs;
}

module.exports = { scrape };
