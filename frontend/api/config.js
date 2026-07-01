const ROLES = ["quality analyst", "mern stack developer", "react developer", "nodejs developer"];
const LOCATIONS = ["pune", "bangalore", "delhi", "gurgaon", "noida", "chandigarh", "remote"];

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({ roles: ROLES, locations: LOCATIONS });
};
