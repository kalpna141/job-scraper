const { newPage } = require("../browser");

function toSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

async function scrape(role, location) {
  const jobs = [];
  const url = `https://www.shine.com/job-search/${toSlug(role)}-jobs-in-${toSlug(location)}`;
  let page;

  try {
    page = await newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForSelector(".jdbigCard", { timeout: 10000 }).catch(() => {});

    const extracted = await page.evaluate(() => {
      const cards = document.querySelectorAll(".jdbigCard");
      return Array.from(cards).map((el) => {
        const titleEl = el.querySelector("h3[itemprop='name']");
        const companyEl = el.querySelector("[class*=TitleName]");
        const expEl = el.querySelector("[class*=expRange], [class*=Exp]");
        const locEl = el.querySelector("[class*=location], [class*=Location]");
        const postedEl = el.querySelector("[class*=postedData]");
        const href = el.querySelector("h3 a")?.href || el.querySelector("meta[itemprop='url']")?.content || "";
        return {
          title: titleEl?.getAttribute("title") || titleEl?.innerText?.trim() || "",
          company: companyEl?.getAttribute("title") || companyEl?.innerText?.trim() || "",
          experience: expEl?.innerText?.trim() || "",
          location: locEl?.innerText?.trim() || "",
          posted: postedEl?.innerText?.trim() || "",
          href,
        };
      });
    });

    extracted.forEach(({ title, company, experience, location: loc, posted, href }) => {
      if (title && company) {
        jobs.push({
          title,
          company,
          experience: experience || "Not specified",
          location: loc || location,
          source: "Shine",
          postedDate: posted || "Recently",
          url: href || url,
        });
      }
    });
  } catch (err) {
    console.error(`[Shine] Error for ${role} in ${location}:`, err.message);
  } finally {
    if (page) await page.close();
  }

  return jobs;
}

module.exports = { scrape };
