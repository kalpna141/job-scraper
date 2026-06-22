export default function Filters({ sources, activeSource, onSourceChange, expRange, onExpChange }) {
  const sourceColors = {
    Naukri: "#ff7555",
    Indeed: "#2164f3",
    Shine: "#00a651",
    TimesJobs: "#e8312a",
    "Company Career Page": "#7c3aed",
    all: "#6b7280",
  };

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
