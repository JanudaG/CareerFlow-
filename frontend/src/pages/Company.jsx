import { useEffect, useState } from "react";
import { api, getSession } from "../lib/api";
import "./Dashboard.css";

const empty = {title:"", description:"", location:"", salaryRange:"", requirements:""};
const statuses = ["Applied","Under Review","Interview","Accepted","Rejected"];

export default function Company() {
  const user = getSession()?.user;
  const [jobs,setJobs] = useState([]);
  const [form,setForm] = useState(empty);
  const [selected,setSelected] = useState(null);
  const [applicants,setApplicants] = useState([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  async function loadJobs() {
    const {data} = await api.get("/jobs/mine");
    setJobs(data);
  }
  useEffect(()=>{
    let active=true;
    api.get("/jobs/mine").then(({data})=>{if(active)setJobs(data);})
      .catch(e=>{if(active)setError(e.response?.data?.message||"Could not load jobs");});
    return ()=>{active=false;};
  },[]);
  async function postJob(e) {
    e.preventDefault();setBusy(true);setError("");setNotice("");
    try {
      await api.post("/jobs",{...form,requirements:form.requirements.split("\n").map(s=>s.trim()).filter(Boolean)});
      setForm(empty);await loadJobs();setNotice("Job published successfully");
    } catch(e){setError(e.response?.data?.message||"Job creation failed");}
    finally{setBusy(false);}
  }
  async function changeJobStatus(job) {
    setError("");
    try { await api.patch(`/jobs/${job._id}`,{status:job.status==="open"?"closed":"open"});await loadJobs(); }
    catch(e){setError(e.response?.data?.message||"Could not update listing");}
  }
  async function viewApplicants(job) {
    setError("");
    try {
      const {data}=await api.get(`/applications/job/${job._id}`);
      setApplicants(data);setSelected(job);
    } catch(e){setError(e.response?.data?.message||"Could not load applicants");}
  }
  async function setStatus(id,status) {
    setError("");
    try {
      await api.patch(`/applications/${id}/status`,{status});
      const {data}=await api.get(`/applications/job/${selected._id}`);
      setApplicants(data);
    } catch(e){setError(e.response?.data?.message||"Could not update application");}
  }
  return <main className="cf-page">
    <header className="cf-hero"><p className="cf-eyebrow">EMPLOYER PORTAL</p><h1>Welcome, {user?.name || "Employer"} 👋</h1><p>Publish jobs and manage applicants.</p></header>
    {error && <p className="cf-alert" role="alert">{error}</p>}{notice && <p className="cf-success" role="status">{notice}</p>}
    <section className="cf-panel"><h2>Post a job</h2><form className="cf-form" onSubmit={postJob}>
      <label>Job title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
      <label>Salary range<input value={form.salaryRange} onChange={e=>setForm({...form,salaryRange:e.target.value})}/></label>
      <label className="cf-wide">Description<textarea required rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label className="cf-wide">Requirements (one per line)<textarea rows="3" value={form.requirements} onChange={e=>setForm({...form,requirements:e.target.value})}/></label>
      <button className="cf-button" type="submit" disabled={busy}>{busy?"Publishing...":"Publish job"}</button>
    </form></section>
    <h2>My job listings ({jobs.length})</h2>
    {jobs.length===0?<p>No jobs posted yet.</p>:<div className="cf-grid">{jobs.map(job=><article className="cf-card" key={job._id}>
      <span className="cf-pill">{job.status}</span><h3>{job.title}</h3><p>📍 {job.location||"Location not specified"}</p>
      <p className="cf-muted">{job.description}</p><div className="cf-actions">
        <button className="cf-button" onClick={()=>viewApplicants(job)}>View applicants</button>
        <button className="cf-button secondary" onClick={()=>changeJobStatus(job)}>{job.status==="open"?"Close listing":"Reopen listing"}</button>
      </div>
    </article>)}</div>}
    {selected && <div className="cf-overlay" onClick={()=>setSelected(null)}><section className="cf-modal" role="dialog" aria-modal="true" aria-label="Applicants" onClick={e=>e.stopPropagation()}>
      <button className="cf-close" aria-label="Close" onClick={()=>setSelected(null)}>×</button><h2>Applicants — {selected.title}</h2>
      {applicants.length===0?<p>No applicants yet.</p>:applicants.map(a=><article className="cf-applicant" key={a._id}>
        <h3>{a.applicant?.name||"Applicant"}</h3><p>{a.applicant?.email}</p>
        {a.applicant?.skills?.length>0&&<p>Skills: {a.applicant.skills.join(", ")}</p>}
        {a.applicant?.resumeLink&&<p><a href={a.applicant.resumeLink} target="_blank" rel="noopener noreferrer">Resume</a></p>}
        <label>Status<select value={a.status} onChange={e=>setStatus(a._id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      </article>)}
    </section></div>}
  </main>;
}
