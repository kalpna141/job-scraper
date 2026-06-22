const ROLES = [
  "quality analyst",
  "mern stack developer",
  "react developer",
  "nodejs developer",
];

const LOCATIONS = [
  "pune",
  "bangalore",
  "delhi",
  "gurgaon",
  "noida",
  "chandigarh",
  "remote",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

function randomAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1000, max = 3000) {
  return sleep(Math.floor(Math.random() * (max - min + 1)) + min);
}

module.exports = { ROLES, LOCATIONS, USER_AGENTS, randomAgent, randomDelay };
