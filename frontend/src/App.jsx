import { useState } from "react";
import { api } from "./api";
import SearchBar from "./components/SearchBar";
import JobList from "./components/JobList";
import Filters from "./components/Filters";
import { matchesExperience, defaultExpRange } from "./utils/experience";

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

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [activeSource, setActiveSource] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [expRange, setExpRange] = useState({ min: 0, max: 20 });

  const filteredJobs = jobs.filter((j) => {
    const sourceOk = activeSource === "all" || j.source === activeSource;
    const expOk = matchesExperience(j.experience, expRange.min, expRange.max);
    return sourceOk && expOk;
  });

  const sources = ["all", ...new Set(jobs.map((j) => j.source))];

  async function handleSearch(role, location) {
    setLoading(true);
    setError("");
    setSearched(true);
    setActiveSource("all");
    setSelectedRole(role);
    setSelectedLocation(location);
    // Auto-set experience range based on role
    setExpRange(defaultExpRange(role));

    try {
      const { data } = await api.get("/api/jobs", {
        params: { role, location },
      });
      setJobs(data.jobs);
    } catch {
      setError("Failed to fetch jobs. Make sure the backend server is running.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">🔍</span> JobScraper India
          </h1>
          <p className="tagline">
            Find tech jobs across India's top job portals — Naukri, Indeed, Shine, TimesJobs & Company Career Pages
          </p>
        </div>
      </header>

      <main className="main">
        <SearchBar roles={ROLES} locations={LOCATIONS} onSearch={handleSearch} loading={loading} />

        {searched && !loading && (
          <div className="results-section">
            <div className="results-header">
              <p className="result-count">
                <strong>{filteredJobs.length}</strong> job{filteredJobs.length !== 1 ? "s" : ""} found
                {selectedRole !== "all" ? ` for "${selectedRole}"` : ""}
                {selectedLocation !== "all" ? ` in ${selectedLocation}` : " across all locations"}
                <span className="exp-badge">
                  {expRange.max >= 20 ? "Any experience" : `${expRange.min}–${expRange.max} yrs exp`}
                </span>
              </p>
            </div>

            {jobs.length > 0 && (
              <Filters
                sources={sources}
                activeSource={activeSource}
                onSourceChange={setActiveSource}
                expRange={expRange}
                onExpChange={setExpRange}
              />
            )}
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Scraping job portals... this may take a moment</p>
          </div>
        ) : (
          <JobList jobs={filteredJobs} searched={searched} />
        )}
      </main>

      <footer className="footer">
        <p>Data sourced from Naukri · Indeed · Shine · TimesJobs · Company Career Pages</p>
      </footer>
    </div>
  );
}
