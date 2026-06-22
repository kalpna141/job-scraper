import JobCard from "./JobCard";

export default function JobList({ jobs, searched }) {
  if (!searched) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💼</div>
        <h2>Find Tech Jobs in India</h2>
        <p>Select a role and location above, then click Search Jobs to fetch live listings from Naukri, Indeed, Shine, and TimesJobs.</p>
        <div className="supported-roles">
          <span className="role-tag">Quality Analyst</span>
          <span className="role-tag">MERN Stack Developer</span>
          <span className="role-tag">React Developer</span>
          <span className="role-tag">Node.js Developer</span>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h2>No jobs found</h2>
        <p>Try a different role, location, or check back later. Job portals may also have temporary rate limits.</p>
      </div>
    );
  }

  return (
    <div className="job-grid">
      {jobs.map((job, i) => (
        <JobCard key={`${job.title}-${job.company}-${i}`} job={job} />
      ))}
    </div>
  );
}
