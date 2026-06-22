const { newPage } = require("../browser");

async function scrape(role, location) {
  const jobs = [];
  const url = `https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=${encodeURIComponent(role)}&txtLocation=${encodeURIComponent(location)}`;
  let page;

  try {
    page = await newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // TimesJobs uses dynamic class names — wait for any list items with job content
    await page.waitForFunction(
      () => document.querySelectorAll("li.clearfix").length > 0,
      { timeout: 10000 }
    ).catch(() => {});

    const extracted = await page.evaluate(() => {
      const cards = document.querySelectorAll("li.clearfix");
      return Array.from(cards)
        .filter((el) => el.querySelector("h2"))
        .map((el) => ({
          title: el.querySelector("h2 a")?.innerText?.trim() || "",
          company: el.querySelector(".joblist-comp-name, .comp-dtls-wrap strong")?.innerText?.trim() || "",
          experience: el.querySelector(".srp-skills, .job-skills")?.innerText?.trim() || "",
          location: el.querySelector(".srp-skills + ul li:nth-child(2), .loc span")?.innerText?.trim() || "",
          posted: el.querySelector(".sim-posted span")?.innerText?.trim() || "",
          href: el.querySelector("h2 a")?.href || "",
        }));
    });

    extracted.forEach(({ title, company, experience, location: loc, posted, href }) => {
      if (title && company) {
        jobs.push({
          title,
          company,
          experience: experience || "Not specified",
          location: loc || location,
          source: "TimesJobs",
          postedDate: posted || "Recently",
          url: href || url,
        });
      }
    });
  } catch (err) {
    console.error(`[TimesJobs] Error for ${role} in ${location}:`, err.message);
  } finally {
    if (page) await page.close();
  }

  return jobs;
}

module.exports = { scrape };
