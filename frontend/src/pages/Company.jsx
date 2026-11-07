
import "./Dashboard.css";
import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import {
  Briefcase,
  Plus,
  X,
  Eye,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { api as http, getSession } from "../lib/api.js";

// ================================================
// SHARED UI
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
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modalhead">
          <h2>{title}</h2>
          <button
            type="button"
            className="iconbtn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Confirm({ title, text, onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{text}</p>
      <div className="row end">
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="danger"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Processing..." : "Confirm"}
        </button>
      </div>
    </Modal>
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
      {error && (
        <span className="fielderror">{error}</span>
      )}
    </label>
  );
}

// ================================================
// CURRENT USER
// ================================================

function getCurrentUserName() {
  const user = getSession()?.user || {};

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    user.name?.trim() ||
    fullName ||
    user.username ||
    "User"
  );
}

// ================================================
// API ADAPTER
// ================================================

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data?.applications)) {
    return data.applications;
  }
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
    requiredSkills:
      j?.requiredSkills || j?.requirements || [],
    preferredField: j?.preferredField || "",
    preferredDegree: j?.preferredDegree || "",
    minimumGpa: j?.minimumGpa ?? "",
    openings: j?.openings ?? 1,
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
    internship:
      a?.internship || a?.job || null,
    student:
      a?.student ||
      a?.applicant ||
      a?.user ||
      null,
    status: a?.status || "submitted",
  };
}

async function fetchMyJobs() {
  const data = await request("/jobs/mine");
  return toList(data).map(normalizeJob);
}

// ================================================
// JOB FORM
// ================================================

const DEGREE_OPTIONS = [
  "Any",
  "Certificate",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
];

const emptyJob = {
  title: "",
  description: "",
  location: "",
  salaryRange: "",
  requiredSkills: [],
  preferredField: "",
  preferredDegree: "Any",
  minimumGpa: "",
  openings: 1,
  closingDate: "",
  status: "open",
};

function JobForm({ job: initial, onClose, onSaved }) {
  const notify = useToast();

  const [form, setForm] = useState({
    ...emptyJob,
    ...initial,
    requiredSkills: initial?.requiredSkills || [],
  });

  const [skill, setSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const editing = Boolean(initial?._id);

  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const addSkill = () => {
    const value = skill.trim();

    if (!value) return;

    if (
      form.requiredSkills.some(
        (existing) =>
          existing.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      notify("This skill is already added.", "error");
      return;
    }

    if (form.requiredSkills.length >= 30) {
      notify("Maximum 30 skills allowed.", "error");
      return;
    }

    set("requiredSkills", [
      ...form.requiredSkills,
      value,
    ]);
    setSkill("");
  };

  const validate = () => {
    const next = {};

    if (!form.title.trim()) {
      next.title = "Job title is required.";
    }

    if (!form.description.trim()) {
      next.description = "Description is required.";
    }

    if (!form.location.trim()) {
      next.location = "Location is required.";
    }

    if (
      form.minimumGpa !== "" &&
      (
        !Number.isFinite(Number(form.minimumGpa)) ||
        Number(form.minimumGpa) < 0 ||
        Number(form.minimumGpa) > 4
      )
    ) {
      next.minimumGpa =
        "GPA must be between 0 and 4.";
    }

    if (
      !Number.isInteger(Number(form.openings)) ||
      Number(form.openings) < 1
    ) {
      next.openings =
        "Openings must be a positive integer.";
    }

    if (
      form.closingDate &&
      form.closingDate <
        new Date().toISOString().slice(0, 10)
    ) {
      next.closingDate =
        "Closing date cannot be in the past.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setBusy(true);

    try {
      // Only fields supported by current backend.
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        salaryRange: form.salaryRange.trim(),
        requirements: form.requiredSkills,
        status: form.status,
      };

      if (editing) {
        await request(
          `/jobs/${initial._id}`,
          "PATCH",
          payload
        );
      } else {
        await request(
          "/jobs",
          "POST",
          payload
        );
      }

      notify(
        editing
          ? "Job updated successfully."
          : "Job created successfully."
      );

      onSaved();
    } catch (error) {
      notify(
        error.message || "Unable to save job.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        editing
          ? "Edit job listing"
          : "Create new job"
      }
      onClose={onClose}
    >
      <form className="stack" onSubmit={submit}>
        <div className="formgrid">
          <Field
            label="Job title *"
            error={errors.title}
          >
            <input
              value={form.title}
              onChange={(e) =>
                set("title", e.target.value)
              }
              placeholder="Software Engineer Intern"
            />
          </Field>

          <Field
            label="Location *"
            error={errors.location}
          >
            <input
              value={form.location}
              onChange={(e) =>
                set("location", e.target.value)
              }
              placeholder="Colombo / Remote"
            />
          </Field>

          <Field label="Salary range">
            <input
              value={form.salaryRange}
              onChange={(e) =>
                set("salaryRange", e.target.value)
              }
              placeholder="LKR 50,000 - 80,000"
            />
          </Field>

          <Field label="Preferred field">
            <input
              value={form.preferredField}
              onChange={(e) =>
                set("preferredField", e.target.value)
              }
              placeholder="Computer Science"
            />
          </Field>

          <Field label="Preferred degree">
            <select
              value={form.preferredDegree}
              onChange={(e) =>
                set(
                  "preferredDegree",
                  e.target.value
                )
              }
            >
              {DEGREE_OPTIONS.map((degree) => (
                <option key={degree}>
                  {degree}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Minimum GPA"
            error={errors.minimumGpa}
          >
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={form.minimumGpa}
              onChange={(e) =>
                set("minimumGpa", e.target.value)
              }
            />
          </Field>

          <Field
            label="Number of openings"
            error={errors.openings}
          >
            <input
              type="number"
              min="1"
              value={form.openings}
              onChange={(e) =>
                set("openings", e.target.value)
              }
            />
          </Field>

          <Field
            label="Closing date"
            error={errors.closingDate}
          >
            <input
              type="date"
              value={form.closingDate}
              onChange={(e) =>
                set("closingDate", e.target.value)
              }
            />
          </Field>

          <Field label="Job status">
            <select
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value)
              }
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
        </div>

        <Field
          label="Job description *"
          error={errors.description}
        >
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) =>
              set("description", e.target.value)
            }
            placeholder="Describe responsibilities..."
          />
        </Field>

        <Field label="Required skills">
          <div className="row">
            <input
              value={skill}
              onChange={(e) =>
                setSkill(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill"
            />

            <button
              type="button"
              className="secondary"
              onClick={addSkill}
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          <div className="tags editable">
            {form.requiredSkills.map((item) => (
              <span key={item}>
                {item}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "requiredSkills",
                      form.requiredSkills.filter(
                        (x) => x !== item
                      )
                    )
                  }
                  aria-label={`Remove ${item}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </Field>

        <p className="muted">
          Advanced fields such as GPA, degree,
          openings and deadline require backend
          support before they can be saved.
        </p>

        <div className="row end">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Saving..."
              : editing
              ? "Save changes"
              : "Publish job"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ================================================
// JOB BROWSER
// ================================================

function JobBrowser({
  reloadKey,
  onView,
  onEdit,
  onDelete,
  onTotal,
}) {
  const notify = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [degree, setDegree] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchMyJobs()
      .then((data) => {
        if (!active) return;
        setJobs(data);
        onTotal?.(data.length);
      })
      .catch((error) => {
        if (active) {
          notify(error.message, "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filtered = jobs
    .filter((j) => {
      const q = query.toLowerCase().trim();

      const text = [
        j.title,
        j.description,
        ...(j.requiredSkills || []),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || text.includes(q)) &&
        (!location ||
          (j.location || "")
            .toLowerCase()
            .includes(location.toLowerCase())) &&
        (!status || j.status === status) &&
        (!degree ||
          !j.preferredDegree ||
          j.preferredDegree === degree)
      );
    })
    .sort((a, b) => {
      if (sort === "title") {
        return (a.title || "").localeCompare(
          b.title || ""
        );
      }

      const first = new Date(
        a.createdAt || 0
      ).getTime();

      const second = new Date(
        b.createdAt || 0
      ).getTime();

      return sort === "oldest"
        ? first - second
        : second - first;
    });

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, pages);

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
          {DEGREE_OPTIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
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
          onChange={(e) =>
            setSort(e.target.value)
          }
        >
          <option value="newest">
            Newest first
          </option>
          <option value="oldest">
            Oldest first
          </option>
          <option value="title">
            Title A-Z
          </option>
        </select>
      </div>

      {loading ? (
        <div className="card empty">
          Loading jobs...
        </div>
      ) : (
        <>
          <div className="cards">
            {visible.map((j) => (
              <div
                className="card jobcard"
                key={j._id}
              >
                <div className="row between">
                  <span
                    className={`status status-${j.status}`}
                  >
                    {j.status}
                  </span>

                  <small>
                    {j.createdAt
                      ? new Date(
                          j.createdAt
                        ).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                <h3>{j.title}</h3>

                <p>
                  <MapPin size={14} />{" "}
                  {j.location ||
                    "Location not specified"}
                </p>

                <p className="clamp">
                  {j.description}
                </p>

                <Tags
                  items={j.requiredSkills.slice(0, 5)}
                />

                <div className="row between jobactions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onView(j)}
                  >
                    <Eye size={16} />
                    Details
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onEdit(j)}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(j)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!visible.length && (
            <Empty text="No job listings match your filters." />
          )}

          <div className="pagination">
            <span>
              {filtered.length} results · Page{" "}
              {currentPage} of {pages}
            </span>

            <div className="row">
              <button
                type="button"
                className="secondary iconbtn"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage(currentPage - 1)
                }
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                className="secondary iconbtn"
                disabled={currentPage === pages}
                onClick={() =>
                  setPage(currentPage + 1)
                }
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
// JOB DETAILS
// ================================================

function JobDetail({
  id,
  onClose,
  onEdit,
  onDelete,
}) {
  const notify = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    request(`/jobs/${id}`)
      .then((data) => {
        if (active) {
          setItem(normalizeJob(data));
        }
      })
      .catch((error) => {
        if (active) {
          notify(error.message, "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Modal
      title="Job details"
      onClose={onClose}
    >
      {loading ? (
        <p>Loading...</p>
      ) : !item ? (
        <Empty text="Job not found." />
      ) : (
        <div className="stack">
          <span
            className={`status status-${item.status}`}
          >
            {item.status}
          </span>

          <h2>{item.title}</h2>
          <p>{item.location}</p>

          <div className="detailgrid">
            <div>
              <small>Salary range</small>
              <b>
                {item.salaryRange ||
                  "Not specified"}
              </b>
            </div>

            <div>
              <small>Minimum GPA</small>
              <b>
                {item.minimumGpa ||
                  "Not specified"}
              </b>
            </div>

            <div>
              <small>Preferred degree</small>
              <b>
                {item.preferredDegree ||
                  "Any"}
              </b>
            </div>

            <div>
              <small>Openings</small>
              <b>
                {item.openings ||
                  "Not specified"}
              </b>
            </div>
          </div>

          <h3>Description</h3>
          <p className="prewrap">
            {item.description}
          </p>

          <h3>Required skills</h3>
          <Tags items={item.requiredSkills} />

          <div className="row end">
            <button
              type="button"
              className="secondary"
              onClick={() => onEdit(item)}
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              className="danger"
              onClick={() => onDelete(item)}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ================================================
// COMPANY DASHBOARD
// ================================================

const APPLICATION_STAGES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
];

function CompanyContent() {
  const notify = useToast();

  const userName = getCurrentUserName();

  const [applications, setApplications] =
    useState([]);

  const [matches] = useState([]);

  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const myJobs = await fetchMyJobs();

      const groups = await Promise.all(
        myJobs.map(async (j) => {
          try {
            const data = await request(
              `/applications/job/${j._id}`
            );

            return toList(data).map(
              normalizeApplication
            );
          } catch {
            return [];
          }
        })
      );

      setApplications(groups.flat());
      setReloadKey((value) => value + 1);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStage = async (id, status) => {
    try {
      await request(
        `/applications/${id}/status`,
        "PATCH",
        { status }
      );

      notify("Application stage updated.");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const removeJob = async () => {
    setBusy(true);

    notify(
      "Job deletion requires backend support. No changes were made.",
      "error"
    );

    setBusy(false);
    setToDelete(null);
  };

  const editJob = (j) => {
    setViewId(null);
    setForm(j);
  };

  const deleteJob = (j) => {
    setViewId(null);
    setToDelete(j);
  };

  return (
    <div className="cf-skillmatch wrap">
      {/* WELCOME SECTION */}
      <div className="welcome">
        <div>
          <span className="eyebrow">
            CAREERFLOW / COMPANY
          </span>

          <h1>
            Welcome, {userName}!
          </h1>

          <p>
            Post opportunities, manage your
            listings and connect with
            talented candidates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setForm("new")}
        >
          <Plus size={18} />
          Post New Job
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid stats">
        <Stat
          n={total}
          t="Total Jobs"
        />

        <Stat
          n={applications.length}
          t="Applications"
        />

        <Stat
          n={
            applications.filter((a) =>
              [
                "shortlisted",
                "interview",
                "offered",
              ].includes(a.status)
            ).length
          }
          t="In Late Stages"
        />
      </div>

      {/* JOB LISTINGS */}
      <h2>Manage Job Listings</h2>

      <JobBrowser
        reloadKey={reloadKey}
        onTotal={setTotal}
        onView={(j) =>
          setViewId(j._id)
        }
        onEdit={editJob}
        onDelete={deleteJob}
      />

      {/* APPLICATION PIPELINE */}
      <h2>Application Pipeline</h2>

      <div className="table card">
        <div className="tr apptr th">
          <span>Candidate</span>
          <span>Job</span>
          <span>Current Stage</span>
          <span>Update Stage</span>
        </div>

        {!applications.length && (
          <div className="tr">
            <span>
              No applications yet.
            </span>
          </div>
        )}

        {applications.map((a) => (
          <div
            className="tr apptr"
            key={a._id}
          >
            <span>
              <b>
                {a.student?.name ||
                  a.student?.user?.name ||
                  "Candidate"}
              </b>

              <small>
                {a.student?.field || ""}
                {a.student?.gpa != null
                  ? ` · GPA ${a.student.gpa}`
                  : ""}
              </small>
            </span>

            <span>
              <b>
                {a.internship?.title ||
                  "Job"}
              </b>
            </span>

            <span
              className={`status status-${a.status}`}
            >
              {a.status}
            </span>

            <span>
              {a.status === "withdrawn" ? (
                <small>
                  Withdrawn by candidate
                </small>
              ) : (
                <select
                  value={a.status}
                  onChange={(e) =>
                    updateStage(
                      a._id,
                      e.target.value
                    )
                  }
                >
                  {APPLICATION_STAGES.map(
                    (stage) => (
                      <option
                        key={stage}
                        value={stage}
                      >
                        {stage}
                      </option>
                    )
                  )}
                </select>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* MATCHES */}
      <h2>Admin-Approved Candidates</h2>

      <div className="cards">
        {matches.length ? (
          matches.map((m) => (
            <div
              className="card match"
              key={m._id}
            >
              <div
                className="ring"
                style={{
                  "--p": `${
                    Math.min(
                      100,
                      Math.max(0, m.score)
                    ) * 3.6
                  }deg`,
                }}
              >
                <b>{m.score}%</b>
              </div>

              <div>
                <span className="status">
                  APPROVED MATCH
                </span>

                <h3>
                  {m.student?.user?.name ||
                    "Candidate"}
                </h3>

                <p>
                  {m.student?.degree} in{" "}
                  {m.student?.field}
                </p>

                <Tags
                  items={m.matchedSkills || []}
                />
              </div>
            </div>
          ))
        ) : (
          <Empty
            text="Approved candidate matches will appear after matching backend integration."
          />
        )}
      </div>

      {/* MODALS */}
      {form && (
        <JobForm
          job={
            form === "new"
              ? null
              : form
          }
          onClose={() =>
            setForm(null)
          }
          onSaved={() => {
            setForm(null);
            load();
          }}
        />
      )}

      {viewId && (
        <JobDetail
          id={viewId}
          onClose={() =>
            setViewId(null)
          }
          onEdit={editJob}
          onDelete={deleteJob}
        />
      )}

      {toDelete && (
        <Confirm
          title="Delete job listing?"
          text={`Deleting "${toDelete.title}" requires backend support.`}
          onConfirm={removeJob}
          onCancel={() =>
            setToDelete(null)
          }
          busy={busy}
        />
      )}
    </div>
  );
}

export default function Company() {
  return (
    <ToastProvider>
      <CompanyContent />
    </ToastProvider>
  );
}
