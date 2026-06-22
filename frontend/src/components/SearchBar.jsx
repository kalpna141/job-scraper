import { useState } from "react";

export default function SearchBar({ roles, locations, onSearch, loading }) {
  const [role, setRole] = useState("all");
  const [location, setLocation] = useState("all");

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(role, location);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-fields">
        <div className="field-group">
          <label>Job Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="all">All Locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l.replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? "Searching..." : "Search Jobs"}
        </button>
      </div>
    </form>
  );
}
