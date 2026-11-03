import { useEffect, useState } from "react";
import { api, getSession } from "../lib/api";
import "./Dashboard.css";

export default function JobSeeker() {
  const user = getSession()?.user;
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [tab, setTab] = useState("jobs");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshApplications() {
    const { data } = await api.get("/applications/mine");
    setApplications(data);
  }
  useEffect(() => {
    let active = true;
    api.get("/applications/mine").then(({data}) => { if(active) setApplications(data); })
      .catch(e => { if(active) setError(e.response?.data?.message || "Could not load applications"); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/jobs", { params: {search, location}, signal: ctrl.signal });
        if (!ctrl.signal.aborted) { setJobs(data.filter(j => j.status === "open")); setError(""); }
      } catch(e) {
        if(!ctrl.signal.aborted) setError(e.response?.data?.message || "Could not load jobs");
      } finally { if(!ctrl.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [search,location]);

  const applied = new Set(applications.filter(a => a.job).map(a => a.job._id));
  async function apply(job) {
    setBusy(true); setError(""); setNotice("");
    try {
      await api.post(`/applications/${job._id}`);
      await refreshApplications();
      setSelected(null);
      setNotice("Application successfully submitted.");
    } catch(e) { setError(e.response?.data?.message || "Application failed"); }
    finally { setBusy(false); }
  }

  return <main className="cf-page">
    <header className="cf-hero"><p className="cf-eyebrow">JOB SEEKER</p><h1>Welcome, {user?.name || "Job Seeker"} 👋</h1><p>Find opportunities and track your applications.</p></header>
    <div className="cf-tabs"><button className={tab==="jobs"?"active":""} onClick={()=>setTab("jobs")}>Browse jobs</button><button className={tab==="applications"?"active":""} onClick={()=>setTab("applications")}>My applications ({applications.length})</button></div>
    {error && <p className="cf-alert" role="alert">{error}</p>}{notice && <p className="cf-success" role="status">{notice}</p>}
    {tab==="jobs" ? <>
      <section className="cf-panel"><h2>Find your dream job</h2><div className="cf-filters">
        <input aria-label="Job title search" placeholder="Search by job title" value={search} onChange={e=>setSearch(e.target.value)}/>
        <input aria-label="Location search" placeholder="Enter location" value={location} onChange={e=>setLocation(e.target.value)}/>
        <button className="cf-button secondary" onClick={()=>{setSearch("");setLocation("");}}>Clear filters</button>
      </div></section>
      <h2>Available jobs</h2>
      {loading ? <p>Loading jobs...</p> : jobs.length===0 ? <p>No matching open jobs.</p> :
        <div className="cf-grid">{jobs.map(j=><article className="cf-card" key={j._id}>
          <span className="cf-pill">Open</span><h3>{j.title}</h3>
          <p>🏢 {j.postedBy?.companyName || j.postedBy?.name || "Company"}</p>
          <p>📍 {j.location || "Not specified"}</p><p>💰 {j.salaryRange || "Salary not specified"}</p>
          <p className="cf-muted">{j.description}</p>
          <div className="cf-actions"><button className="cf-button secondary" onClick={()=>setSelected(j)}>View details</button>
          <button className="cf-button" disabled={busy || applied.has(j._id)} onClick={()=>apply(j)}>{applied.has(j._id)?"Applied ✓":"Apply now"}</button></div>
        </article>)}</div>}
    </> : <>
      <h2>My applications</h2>
      {applications.length===0 ? <p>You haven't applied to any jobs yet.</p> :
        <div className="cf-grid">{applications.map(a=><article className="cf-card" key={a._id}>
          <span className="cf-pill">{a.status}</span><h3>{a.job?.title || "Job unavailable"}</h3>
          <p>{a.job?.postedBy?.companyName || a.job?.postedBy?.name || "Company"}</p>
          <p>📍 {a.job?.location || "Not specified"}</p>
          <p className="cf-muted">Applied {new Date(a.createdAt).toLocaleDateString()}</p>
        </article>)}</div>}
    </>}
    {selected && <div className="cf-overlay" onClick={()=>setSelected(null)}><section className="cf-modal" role="dialog" aria-modal="true" aria-label="Job details" onClick={e=>e.stopPropagation()}>
      <button className="cf-close" aria-label="Close" onClick={()=>setSelected(null)}>×</button>
      <h2>{selected.title}</h2><p>{selected.postedBy?.companyName || "Company"} · {selected.location || "Location not specified"}</p>
      <p>{selected.salaryRange || "Salary not specified"}</p>
      <h3>Job description</h3><p className="cf-preline">{selected.description}</p>
      <h3>Requirements</h3>{selected.requirements?.length ? <ul>{selected.requirements.map((r,i)=><li key={i}>{r}</li>)}</ul>:<p>Not listed</p>}
      <button className="cf-button" disabled={busy||applied.has(selected._id)} onClick={()=>apply(selected)}>{applied.has(selected._id)?"Already applied":busy?"Submitting...":"Apply now"}</button>
    </section></div>}
  </main>;
}
