
import "./Dashboard.css";
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  createContext,
} from "react";
import {
  Briefcase, X, Trash2, Undo2, Plus, Eye,
  Pencil, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { api as http, getSession } from "../lib/api.js";

// ================================================
// USER AND API HELPERS
// ================================================

function getCurrentUser() {
  return getSession()?.user || {};
}

function getCurrentUserName() {
  const user = getCurrentUser();
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user.username ||
    "User"
  );
}

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data?.applications)) return data.applications;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function request(url, method = "GET", body) {
  const response = await http.request({
    url,
    method,
    data: body,
  });
  return unwrap(response);
}

function normalizeJob(j) {
  return {
    ...j,
    _id: j?._id || j?.id,
    requiredSkills: j?.requiredSkills || j?.requirements || [],
    minimumGpa: j?.minimumGpa ?? "",
    preferredDegree: j?.preferredDegree || "",
    preferredField: j?.preferredField || "",
    openings: j?.openings ?? "",
    closingDate: j?.closingDate || "",
    status: j?.status || "open",
    company:
      j?.postedBy?.companyName ||
      j?.postedBy?.name ||
      "Company",
  };
}

function normalizeApplication(a) {
  return {
    ...a,
    _id: a?._id || a?.id,
    internship: a?.internship
      ? normalizeJob(a.internship)
      : a?.job
        ? normalizeJob(a.job)
        : null,
    status: a?.status || "submitted",
  };
}

async function fetchJobs() {
  return toList(await request("/jobs")).map(normalizeJob);
}

async function fetchApplications() {
  return toList(
    await request("/applications/mine")
  ).map(normalizeApplication);
}

// ================================================
// SHARED COMPONENTS
// ================================================

const ToastContext = createContext(() => {});

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div className={`cf-toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

const useToast = () => useContext(ToastContext);

function Modal({ title, onClose, children }) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalhead">
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ n, t }) {
  return (
    <div className="card stat">
      <b>{n}</b>
      <span>{t}</span>
    </div>
  );
}

function Tags({ items = [] }) {
  return (
    <div className="tags">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty card">
      <Briefcase size={28} />
      <p>{text}</p>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className={error ? "invalid" : ""}>
      {label}
      {children}
      {error && <span className="fielderror">{error}</span>}
    </label>
  );
}

// ================================================
// PROFILE
// ================================================

const DEGREES = [
  "Certificate", "Diploma", "Bachelor",
  "Master", "PhD",
];

const blankProfile = {
  name: "",
  university: "",
  degree: "Bachelor",
  field: "",
  gpa: "",
  graduationYear: "",
  bio: "",
  experience: "",
  skills: [],
};

function profileKey() {
  const user = getCurrentUser();
  return `careerflow_profile_${user._id || user.id || user.email || "local"}`;
}

function readProfile() {
  try {
    const raw = localStorage.getItem(profileKey());
    return raw
      ? { ...blankProfile, ...JSON.parse(raw) }
      : null;
  } catch {
    return null;
  }
}

function Profile({ initial, onSaved, onCancel }) {
  const notify = useToast();
  const [form, setForm] = useState({
    ...blankProfile,
    ...initial,
  });
  const [skill, setSkill] = useState("");
  const [errors, setErrors] = useState({});

  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const addSkill = () => {
    const value = skill.trim();
    if (!value) return;

    if (form.skills.some(
      (s) => s.toLowerCase() === value.toLowerCase()
    )) {
      notify("Skill already added.", "error");
      return;
    }

    if (form.skills.length >= 30) {
      notify("Maximum 30 skills allowed.", "error");
      return;
    }

    set("skills", [...form.skills, value]);
    setSkill("");
  };

  const submit = (event) => {
    event.preventDefault();
    const next = {};

    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.field.trim()) next.field = "Field is required.";

    const gpa = Number(form.gpa);
    if (
      form.gpa === "" ||
      !Number.isFinite(gpa) ||
      gpa < 0 ||
      gpa > 4
    ) {
      next.gpa = "GPA must be between 0 and 4.";
    }

    if (
      form.graduationYear &&
      !/^\d{4}$/.test(String(form.graduationYear))
    ) {
      next.graduationYear = "Enter a four-digit year.";
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    const saved = { ...form, gpa };

    try {
      localStorage.setItem(
        profileKey(),
        JSON.stringify(saved)
      );
      notify("Profile saved in this browser.");
      onSaved(saved);
    } catch {
      notify("Could not save profile.", "error");
    }
  };

  return (
    <div className="cf-skillmatch wrap">
      <div className="welcome">
        <div>
          <span className="eyebrow">CAREERFLOW / JOB SEEKER</span>
          <h1>My Profile</h1>
          <p>Manage your qualifications and skills.</p>
        </div>
      </div>

      <form className="card profileform stack" onSubmit={submit}>
        <div className="formgrid">
          <Field label="Full name *" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
            />
          </Field>

          <Field label="University">
            <input
              value={form.university}
              onChange={(e) => set("university", e.target.value)}
              placeholder="University"
            />
          </Field>

          <Field label="Degree">
            <select
              value={form.degree}
              onChange={(e) => set("degree", e.target.value)}
            >
              {DEGREES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="Field of study *" error={errors.field}>
            <input
              value={form.field}
              onChange={(e) => set("field", e.target.value)}
              placeholder="Computer Engineering"
            />
          </Field>

          <Field label="GPA *" error={errors.gpa}>
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={form.gpa}
              onChange={(e) => set("gpa", e.target.value)}
            />
          </Field>

          <Field label="Graduation year" error={errors.graduationYear}>
            <input
              type="number"
              value={form.graduationYear}
              onChange={(e) => set("graduationYear", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Professional summary">
          <textarea
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Field>

        <Field label="Experience / Projects">
          <textarea
            rows={3}
            maxLength={1500}
            value={form.experience}
            onChange={(e) => set("experience", e.target.value)}
          />
        </Field>

        <Field label="Skills">
          <div className="row">
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. React"
            />
            <button type="button" className="secondary" onClick={addSkill}>
              <Plus size={16} /> Add
            </button>
          </div>

          <div className="tags editable">
            {form.skills.map((s) => (
              <span key={s}>
                {s}
                <button
                  type="button"
                  aria-label={`Remove ${s}`}
                  onClick={() =>
                    set("skills", form.skills.filter((x) => x !== s))
                  }
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </Field>

        <div className="row end">
          {onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit">Save Profile</button>
        </div>
      </form>
    </div>
  );
}

// ================================================
// JOB BROWSER
// ================================================

function JobBrowser({
  appliedIds,
  reloadKey,
  onTotal,
  onView,
  onApply,
}) {
  const notify = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [degree, setDegree] = useState("");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchJobs()
      .then((data) => {
        if (!active) return;
        setJobs(data);
        onTotal?.(
          data.filter((j) => j.status === "open").length
        );
      })
      .catch((error) => {
        if (active) notify(error.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reloadKey]);

  const filtered = jobs
    .filter((j) => {
      const q = query.toLowerCase().trim();
      const text = [
        j.title,
        j.description,
        ...(j.requiredSkills || []),
      ].join(" ").toLowerCase();

      return (
        (!q || text.includes(q)) &&
        (!location || (j.location || "")
          .toLowerCase().includes(location.toLowerCase())) &&
        (!degree || !j.preferredDegree || j.preferredDegree === degree) &&
        (!status || j.status === status)
      );
    })
    .sort((a, b) => {
      if (sort === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      const first = new Date(a.createdAt || 0).getTime();
      const second = new Date(b.createdAt || 0).getTime();
      return sort === "oldest" ? first - second : second - first;
    });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice(
    (current - 1) * pageSize,
    current * pageSize
  );

  return (
    <div className="jobbrowser">
      <div className="card filters">
        <div className="searchbox">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, description or skill"
          />
        </div>

        <input
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setPage(1);
          }}
          placeholder="Location"
        />

        <select
          value={degree}
          onChange={(e) => {
            setDegree(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All degrees</option>
          {DEGREES.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="card empty">Loading jobs...</div>
      ) : (
        <>
          <div className="cards">
            {visible.map((j) => (
              <div className="card jobcard" key={j._id}>
                <div className="row between">
                  <span className={`status status-${j.status}`}>
                    {j.status}
                  </span>
                  <small>
                    {j.createdAt
                      ? new Date(j.createdAt).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                <h3>{j.title}</h3>
                <p>
                  {j.company} · {j.location || "Location not specified"}
                </p>
                <p className="clamp">{j.description}</p>
                <Tags items={j.requiredSkills.slice(0, 5)} />

                <div className="row between jobactions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onView(j)}
                  >
                    <Eye size={16} /> Details
                  </button>

                  <button
                    type="button"
                    disabled={
                      appliedIds.includes(j._id) ||
                      j.status !== "open"
                    }
                    onClick={() => onApply(j)}
                  >
                    {appliedIds.includes(j._id) ? "Applied" : "Apply"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!visible.length && (
            <Empty text="No jobs match these filters." />
          )}

          <div className="pagination">
            <span>
              {filtered.length} results · Page {current} of {pages}
            </span>
            <div className="row">
              <button
                type="button"
                className="secondary iconbtn"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="secondary iconbtn"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ================================================
// JOB DETAIL MODAL
// ================================================

function JobDetail({ id, applied, onClose, onApply }) {
  const notify = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    request(`/jobs/${id}`)
      .then((data) => {
        if (active) setItem(normalizeJob(data));
      })
      .catch((error) => {
        if (active) notify(error.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  return (
    <Modal title="Job Details" onClose={onClose}>
      {loading ? (
        <p>Loading...</p>
      ) : !item ? (
        <Empty text="Job not found." />
      ) : (
        <div className="stack">
          <span className={`status status-${item.status}`}>
            {item.status}
          </span>
          <h2>{item.title}</h2>
          <p>{item.company} · {item.location}</p>

          <div className="detailgrid">
            <div>
              <small>Salary range</small>
              <b>{item.salaryRange || "Not specified"}</b>
            </div>
            <div>
              <small>Minimum GPA</small>
              <b>{item.minimumGpa || "Not specified"}</b>
            </div>
            <div>
              <small>Preferred degree</small>
              <b>{item.preferredDegree || "Any"}</b>
            </div>
            <div>
              <small>Openings</small>
              <b>{item.openings || "Not specified"}</b>
            </div>
          </div>

          <h3>Description</h3>
          <p className="prewrap">{item.description}</p>
          <h3>Required skills</h3>
          <Tags items={item.requiredSkills} />

          <div className="row end">
            <button type="button" className="secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              disabled={applied || item.status !== "open"}
              onClick={() => onApply(item)}
            >
              {applied ? "Applied" : "Apply Now"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ================================================
// APPLY MODAL
// ================================================

function ApplyModal({ job, onClose, onDone }) {
  const notify = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (note.length > 1000) return;

    setBusy(true);
    try {
      await request(
        `/applications/${job._id}`,
        "POST"
      );

      notify(
        note.trim()
          ? "Application submitted. Cover note is not yet stored by the backend."
          : "Application submitted successfully."
      );
      onDone();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Apply: ${job.title}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field
          label={`Cover note (optional · ${note.length}/1000)`}
          error={note.length > 1000 ? "Maximum 1000 characters" : ""}
        >
          <textarea
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why are you a good fit?"
          />
        </Field>

        <p className="muted">
          Cover note persistence requires a backend update.
        </p>

        <div className="row end">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy || note.length > 1000}>
            {busy ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ================================================
// MATCH CARD
// ================================================

function MatchCard({ match }) {
  const score = Math.max(
    0,
    Math.min(100, Number(match.score) || 0)
  );

  return (
    <div className="card match">
      <div
        className="ring"
        style={{ "--p": `${score * 3.6}deg` }}
      >
        <b>{score}%</b>
      </div>

      <div>
        <span className="status">APPROVED MATCH</span>
        <h3>
          {match.internship?.title || match.job?.title}
        </h3>
        <p>
          {match.internship?.company?.organization || "Company"}
        </p>
        <Tags items={match.matchedSkills || []} />
        {!!match.missingSkills?.length && (
          <small>
            Develop next: {match.missingSkills.join(", ")}
          </small>
        )}
      </div>
    </div>
  );
}

// ================================================
// JOB SEEKER DASHBOARD
// ================================================

const STAGES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
];

function JobSeekerContent() {
  const notify = useToast();
  const userName = getCurrentUserName();

  const [profile, setProfile] = useState(undefined);
  const [applications, setApplications] = useState([]);
  const [matches] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState(null);
  const [applyJob, setApplyJob] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await fetchApplications();
      setApplications(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setProfile(readProfile());
      setReloadKey((value) => value + 1);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withdraw = () => {
    notify(
      "Withdraw requires a backend endpoint. No changes were made.",
      "error"
    );
  };

  const remove = () => {
    notify(
      "Delete requires a backend endpoint. No changes were made.",
      "error"
    );
  };

  if (profile === undefined) {
    return (
      <div className="cf-skillmatch wrap">
        <p>Loading...</p>
      </div>
    );
  }

  if (editing) {
    return (
      <Profile
        initial={
          profile || {
            ...blankProfile,
            name: userName,
          }
        }
        onSaved={(saved) => {
          setProfile(saved);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const appliedIds = applications
    .filter((a) => a.status !== "withdrawn")
    .map((a) => a.internship?._id)
    .filter(Boolean);

  const startApply = (job) => {
    setViewId(null);
    setApplyJob(job);
  };

  return (
    <div className="cf-skillmatch wrap">
      {/* WELCOME SECTION */}
      <div className="welcome">
        <div>
          <span className="eyebrow">
            CAREERFLOW / JOB SEEKER
          </span>

          <h1>Welcome, {userName}!</h1>

          <p>
            Explore job opportunities, track your applications
            and discover your career matches.
          </p>
        </div>

        <button
          type="button"
          className="secondary"
          onClick={() => setEditing(true)}
        >
          <Pencil size={17} />
          Edit Profile
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* STATISTICS */}
      <div className="grid stats">
        <Stat n={profile?.gpa != null ? `${profile.gpa}/4` : "—"} t="Current GPA" />
        <Stat n={profile?.skills?.length || 0} t="Skills Listed" />
        <Stat n={applications.length} t="Applications" />
      </div>

      {/* APPLICATION TRACKER */}
      <h2>Application Tracker</h2>

      <div className="tracker">
        {applications.length ? (
          applications.map((a) => {
            const stage = STAGES.indexOf(a.status);

            return (
              <div className="card application" key={a._id}>
                <div>
                  <span className={`status status-${a.status}`}>
                    {a.status}
                  </span>

                  <h3>{a.internship?.title || "Job"}</h3>
                  <p>
                    {a.internship?.company || "Company"}
                    {" · Updated "}
                    {a.updatedAt
                      ? new Date(a.updatedAt).toLocaleDateString()
                      : "recently"}
                  </p>
                </div>

                <div>
                  <div className="stagebar">
                    {STAGES.map((s, i) => (
                      <i
                        key={s}
                        className={stage >= i ? "done" : ""}
                        title={s}
                      />
                    ))}
                  </div>

                  <div className="row end appactions">
                    {!["withdrawn", "rejected", "offered"].includes(a.status) && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={withdraw}
                      >
                        <Undo2 size={16} /> Withdraw
                      </button>
                    )}

                    <button
                      type="button"
                      className="danger"
                      onClick={remove}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <Empty text="Apply to a job to start tracking your progress." />
        )}
      </div>

      {/* SMART MATCHES */}
      <h2>Your Smart Matches</h2>

      <div className="cards">
        {matches.length ? (
          matches.map((m) => (
            <MatchCard key={m._id} match={m} />
          ))
        ) : (
          <Empty
            text="Approved matches will appear after matching backend integration."
          />
        )}
      </div>

      {/* JOB BROWSER */}
      <h2>Explore Open Jobs</h2>

      <JobBrowser
        appliedIds={appliedIds}
        reloadKey={reloadKey}
        onTotal={setTotal}
        onView={(j) => setViewId(j._id)}
        onApply={startApply}
      />

      <p className="muted">
        {total} active opportunities available.
      </p>

      {/* MODALS */}
      {viewId && (
        <JobDetail
          id={viewId}
          applied={appliedIds.includes(viewId)}
          onClose={() => setViewId(null)}
          onApply={startApply}
        />
      )}

      {applyJob && (
        <ApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onDone={() => {
            setApplyJob(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function JobSeeker() {
  return (
    <ToastProvider>
      <JobSeekerContent />
    </ToastProvider>
  );
}
