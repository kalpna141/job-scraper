const SOURCE_COLORS = {
  Naukri: { bg: "#fff2ee", badge: "#ff7555" },
  Indeed: { bg: "#eef3ff", badge: "#2164f3" },
  Shine: { bg: "#eefaf3", badge: "#00a651" },
  TimesJobs: { bg: "#fff0f0", badge: "#e8312a" },
  "Career Pages": { bg: "#f5f3ff", badge: "#7c3aed" },
};

export default function JobCard({ job }) {
  const colors = SOURCE_COLORS[job.source] || { bg: "#f3f4f6", badge: "#6b7280" };

  return (
    <div className="job-card" style={{ borderTop: `3px solid ${colors.badge}` }}>
      <div className="job-card-top">
        <span className="source-badge" style={{ backgroundColor: colors.badge }}>
          {job.source}
        </span>
        <span className="posted-date">{job.postedDate}</span>
      </div>

      <h3 className="job-title">{job.title}</h3>
      <p className="job-company">{job.company}</p>

      <div className="job-meta">
        <span className="meta-item">
          <span className="meta-icon">📍</span> {job.location}
        </span>
        {job.experience && job.experience !== "Not specified" && job.experience !== "N/A" && (
          <span className="meta-item">
            <span className="meta-icon">💼</span> {job.experience}
          </span>
        )}
        {job.salary && job.salary !== "Not Disclosed" && (
          <span className="meta-item salary-tag">
            <span className="meta-icon">💰</span> {job.salary}
          </span>
        )}
      </div>

      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="apply-btn"
        style={{ backgroundColor: colors.badge }}
      >
        View & Apply →
      </a>
    </div>
  );
}
