export default function Filters({ sources, activeSource, onSourceChange, expRange, onExpChange, dateFilter, onDateFilterChange, salaryFilter, onSalaryFilterChange, jobsWithSalary, totalJobs }) {
  const sourceColors = {
    Naukri: "#ff7555",
    Indeed: "#2164f3",
    Shine: "#00a651",
    TimesJobs: "#e8312a",
    "Career Pages": "#7c3aed",
    all: "#6b7280",
  };

  const SALARY_PRESETS = [
    { label: "Any salary", value: null },
    { label: "3+ LPA", value: 3 },
    { label: "5+ LPA", value: 5 },
    { label: "8+ LPA", value: 8 },
    { label: "12+ LPA", value: 12 },
    { label: "20+ LPA", value: 20 },
  ];

  const DATE_PRESETS = [
    { label: "All time", value: null },
    { label: "Today", value: 1 },
    { label: "Last 3 days", value: 3 },
    { label: "Last 7 days", value: 7 },
    { label: "Last 15 days", value: 15 },
    { label: "Last 30 days", value: 30 },
  ];

  const EXP_PRESETS = [
    { label: "Any", min: 0, max: 20 },
    { label: "0–1 yr", min: 0, max: 1 },
    { label: "1–2 yrs", min: 1, max: 2 },
    { label: "2–3 yrs", min: 2, max: 3 },
    { label: "3–5 yrs", min: 3, max: 5 },
    { label: "5–8 yrs", min: 5, max: 8 },
    { label: "8+ yrs", min: 8, max: 20 },
  ];

  function isActiveExp(preset) {
    return preset.min === expRange.min && preset.max === expRange.max;
  }

  return (
    <div className="filters-panel">
      <div className="filter-row">
        <span className="filters-label">Source:</span>
        <div className="filter-chips">
          {sources.map((s) => (
            <button
              key={s}
              className={`chip ${activeSource === s ? "chip-active" : ""}`}
              style={
                activeSource === s
                  ? { backgroundColor: sourceColors[s] || "#374151", borderColor: sourceColors[s] || "#374151" }
                  : {}
              }
              onClick={() => onSourceChange(s)}
            >
              {s === "all" ? "All Sources" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filters-label">Posted:</span>
        <div className="filter-chips">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.label}
              className={`chip ${dateFilter === p.value ? "chip-active chip-date" : ""}`}
              onClick={() => onDateFilterChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filters-label">Salary:</span>
        <div className="filter-chips">
          {SALARY_PRESETS.map((p) => (
            <button
              key={p.label}
              className={`chip ${salaryFilter === p.value ? "chip-active chip-salary" : ""}`}
              onClick={() => onSalaryFilterChange(p.value)}
            >
              {p.label}
            </button>
          ))}
          {salaryFilter !== null && (
            <span className="salary-note">
              {jobsWithSalary} of {totalJobs} jobs disclose salary · rest always shown
            </span>
          )}
        </div>
      </div>

      <div className="filter-row">
        <span className="filters-label">Experience:</span>
        <div className="filter-chips">
          {EXP_PRESETS.map((p) => (
            <button
              key={p.label}
              className={`chip ${isActiveExp(p) ? "chip-active chip-exp" : ""}`}
              onClick={() => onExpChange({ min: p.min, max: p.max })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
