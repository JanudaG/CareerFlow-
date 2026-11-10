
import React, { useCallback, useEffect, useState } from "react";
import {
  Briefcase, Plus, X, Eye, Pencil, Trash2, Search,
  ChevronLeft, ChevronRight, MapPin, Users,
  CheckCircle, Mail, Phone, GraduationCap,
  ExternalLink, UserRound, FileText,
} from "lucide-react";
import { api, getSession } from "../lib/api.js";
import "./Dashboard.css";

const DEGREES = [
  "Any", "Certificate", "Diploma",
  "Bachelor", "Master", "PhD",
];

const STAGES = [
  "submitted", "reviewing", "shortlisted",
  "interview", "offered", "rejected",
];

const EMPTY_JOB = {
  title: "",
  description: "",
  location: "",
  salaryRange: "",
  requirements: [],
  preferredField: "",
  preferredDegree: "Any",
  minimumGpa: "",
  openings: 1,
  closingDate: "",
  status: "open",
};

function getUserName() {
  const user = getSession()?.user || {};
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User"
  );
}

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function listOf(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function errorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

async function request(method, url, data) {
  const response = await api.request({ method, url, data });
  return unwrap(response);
}

function normalizeJob(job) {
  return {
    ...job,
    _id: job?._id || job?.id,
    requirements:
      job?.requirements || job?.requiredSkills || [],
    preferredField: job?.preferredField || "",
    preferredDegree: job?.preferredDegree || "Any",
    minimumGpa: job?.minimumGpa ?? "",
    openings: job?.openings ?? 1,
    closingDate: job?.closingDate
      ? String(job.closingDate).slice(0, 10)
      : "",
    status: job?.status || "open",
  };
}

function normalizeApplication(app) {
  return {
    ...app,
    _id: app?._id || app?.id,
    student: app?.student || app?.applicant || {},
    internship: app?.internship || app?.job || {},
    status: app?.status || "submitted",
  };
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="card stat">
      {Icon && <Icon size={22} />}
      <b>{value}</b>
      <span>{label}</span>
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

function Empty({ message }) {
  return (
    <div className="card empty">
      <Briefcase size={28} />
      <p>{message}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal card" role="dialog" aria-modal="true">
        <div className="modalhead">
          <h2>{title}</h2>
          <button
            type="button"
            className="iconbtn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ================================================
// JOB FORM - CREATE / EDIT
// ================================================

function JobForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...EMPTY_JOB,
    ...(initial || {}),
    requirements:
      initial?.requirements || initial?.requiredSkills || [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(initial?._id);

  const set = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;

    if (
      form.requirements.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
    ) {
      setSkillInput("");
      return;
    }

    set("requirements", [...form.requirements, value]);
    setSkillInput("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim()) {
      setError("Job title and description are required.");
      return;
    }

    if (
      form.minimumGpa !== "" &&
      (
        !Number.isFinite(Number(form.minimumGpa)) ||
        Number(form.minimumGpa) < 0 ||
        Number(form.minimumGpa) > 4
      )
    ) {
      setError("Minimum GPA must be between 0 and 4.");
      return;
    }

    if (
      !Number.isInteger(Number(form.openings)) ||
      Number(form.openings) < 1
    ) {
      setError("Openings must be a positive integer.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      salaryRange: form.salaryRange.trim(),
      requirements: form.requirements,
      preferredField: form.preferredField.trim(),
      preferredDegree: form.preferredDegree,
      minimumGpa:
        form.minimumGpa === ""
          ? null
          : Number(form.minimumGpa),
      openings: Number(form.openings),
      closingDate: form.closingDate || null,
      status: form.status,
    };

    try {
      if (editing) {
        await request(
          "PATCH",
          `/jobs/${initial._id}`,
          payload
        );
      } else {
        await request("POST", "/jobs", payload);
      }

      onSaved(
        editing
          ? "Job updated successfully."
          : "Job published successfully."
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Edit Job Listing" : "Post New Job"}
      onClose={onClose}
    >
      <form className="stack" onSubmit={submit}>
        {error && <div className="error">{error}</div>}

        <div className="formgrid">
          <label>
            Job Title *
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Software Engineer Intern"
            />
          </label>

          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Colombo / Remote"
            />
          </label>

          <label>
            Salary Range
            <input
              value={form.salaryRange}
              onChange={(e) => set("salaryRange", e.target.value)}
              placeholder="LKR 50,000 - 80,000"
            />
          </label>

          <label>
            Preferred Field
            <input
              value={form.preferredField}
              onChange={(e) => set("preferredField", e.target.value)}
              placeholder="Computer Engineering"
            />
          </label>

          <label>
            Preferred Degree
            <select
              value={form.preferredDegree}
              onChange={(e) => set("preferredDegree", e.target.value)}
            >
              {DEGREES.map((degree) => (
                <option key={degree} value={degree}>
                  {degree}
                </option>
              ))}
            </select>
          </label>

          <label>
            Minimum GPA
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={form.minimumGpa}
              onChange={(e) => set("minimumGpa", e.target.value)}
            />
          </label>

          <label>
            Number of Openings
            <input
              type="number"
              min="1"
              value={form.openings}
              onChange={(e) => set("openings", e.target.value)}
            />
          </label>

          <label>
            Closing Date
            <input
              type="date"
              value={form.closingDate}
              onChange={(e) => set("closingDate", e.target.value)}
            />
          </label>

          <label>
            Job Status
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>

        <label>
          Job Description *
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the job responsibilities..."
          />
        </label>

        <label>
          Required Skills
          <div className="row">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="React, Node.js, MongoDB..."
            />
            <button
              type="button"
              className="secondary"
              onClick={addSkill}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </label>

        <div className="tags editable">
          {form.requirements.map((skill) => (
            <span key={skill}>
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                onClick={() =>
                  set(
                    "requirements",
                    form.requirements.filter(
                      (item) => item !== skill
                    )
                  )
                }
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        <div className="row end">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editing
                ? "Save Changes"
                : "Publish Job"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ================================================
// JOB DETAILS
// ================================================

function JobDetails({ job, onClose, onEdit, onDelete }) {
  return (
    <Modal title="Job Details" onClose={onClose}>
      <div className="stack">
        <span className={`status status-${job.status}`}>
          {job.status}
        </span>

        <h2>{job.title}</h2>
        <p>{job.location || "Location not specified"}</p>

        <div className="detailgrid">
          <div>
            <small>Salary</small>
            <b>{job.salaryRange || "Not specified"}</b>
          </div>
          <div>
            <small>Minimum GPA</small>
            <b>
              {job.minimumGpa === ""
                ? "Not specified"
                : job.minimumGpa}
            </b>
          </div>
          <div>
            <small>Degree</small>
            <b>{job.preferredDegree}</b>
          </div>
          <div>
            <small>Openings</small>
            <b>{job.openings}</b>
          </div>
          <div>
            <small>Closing Date</small>
            <b>{job.closingDate || "Not specified"}</b>
          </div>
        </div>

        <h3>Description</h3>
        <p className="prewrap">{job.description}</p>

        <h3>Required Skills</h3>
        <Tags items={job.requirements} />

        <div className="row end">
          <button
            type="button"
            className="secondary"
            onClick={() => onEdit(job)}
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => onDelete(job)}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ================================================
// APPLICANT FULL PROFILE MODAL - NEW
// ================================================

function ApplicantProfile({ application, onClose }) {
  const student = application.student || {};

  const email =
    application.contactEmail ||
    student.email ||
    "";

  const phone =
    application.contactPhone ||
    "";

  const skills = Array.isArray(student.skills)
    ? student.skills
    : [];

  const resume = student.resumeLink || "";

  // Only allow HTTP/HTTPS resume links.
  const validResume =
    /^https?:\/\/\S+$/i.test(resume);

  const detailItem = (label, value) => (
    <div>
      <small>{label}</small>
      <p style={{ marginTop: 5 }}>
        <b>
          {value !== null &&
          value !== undefined &&
          value !== ""
            ? value
            : "Not provided"}
        </b>
      </p>
    </div>
  );

  return (
    <Modal title="Applicant Profile" onClose={onClose}>
      <div
        className="stack"
        style={{ maxHeight: "75vh", overflowY: "auto" }}
      >
        <div
          className="row"
          style={{ alignItems: "center", gap: 12 }}
        >
          <UserRound size={38} />

          <div>
            <h2 style={{ margin: 0 }}>
              {student.name || "Candidate"}
            </h2>
            <p style={{ margin: "6px 0" }}>
              {student.field || "Field not provided"}
            </p>
            <span
              className={`status status-${application.status}`}
            >
              {application.status}
            </span>
          </div>
        </div>

        <p>
          Applied for:{" "}
          <b>
            {application.internship?.title || "Job"}
          </b>
        </p>

        <hr />

        <h3>
          <GraduationCap
            size={18}
            style={{ display: "inline", marginRight: 6 }}
          />
          Education Details
        </h3>

        <div className="detailgrid">
          {detailItem("University", student.university)}
          {detailItem("Degree", student.degree)}
          {detailItem("Field of Study", student.field)}
          {detailItem(
            "GPA",
            student.gpa != null
              ? `${student.gpa} / 4.00`
              : ""
          )}
        </div>

        <hr />

        <h3>Professional Summary</h3>
        <p className="prewrap">
          {student.bio || "No professional summary provided."}
        </p>

        <h3>Skills</h3>
        {skills.length ? (
          <Tags items={skills} />
        ) : (
          <p>No skills listed.</p>
        )}

        <h3>Experience / Projects</h3>
        <p className="prewrap">
          {student.experience ||
            "No experience or projects provided."}
        </p>

        <hr />

        <h3>
          <Mail
            size={18}
            style={{ display: "inline", marginRight: 6 }}
          />
          Contact Information
        </h3>

        <div className="detailgrid">
          <div>
            <small>Contact Email</small>
            <p>
              {email ? (
                <a href={`mailto:${email}`}>
                  {email}
                </a>
              ) : (
                "Not provided"
              )}
            </p>
          </div>

          <div>
            <small>Phone Number</small>
            <p>
              {phone ? (
                <a href={`tel:${phone.replace(/[\s().-]/g, "")}`}>
                  <Phone
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 5,
                    }}
                  />
                  {phone}
                </a>
              ) : (
                "Not provided"
              )}
            </p>
          </div>
        </div>

        <hr />

        <h3>
          <FileText
            size={18}
            style={{ display: "inline", marginRight: 6 }}
          />
          Cover Note
        </h3>

        <p className="prewrap">
          {application.coverNote ||
            "No cover note submitted."}
        </p>

        <h3>Resume / CV</h3>

        {validResume ? (
          <a
            href={resume}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink
              size={16}
              style={{
                display: "inline",
                marginRight: 6,
              }}
            />
            View Applicant Resume
          </a>
        ) : (
          <p>No resume link provided.</p>
        )}

        <hr />

        <small>
          Application submitted:{" "}
          {application.createdAt
            ? new Date(
                application.createdAt
              ).toLocaleDateString()
            : "Not available"}
        </small>

        <div className="row end">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Close Profile
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ================================================
// COMPANY DASHBOARD
// ================================================

export default function Company() {
  const userName = getUserName();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formJob, setFormJob] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Selected applicant profile
  const [viewApplicant, setViewApplicant] = useState(null);

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request("GET", "/jobs/mine");

      const myJobs = listOf(result, "jobs")
        .map(normalizeJob);

      setJobs(myJobs);

      const groups = await Promise.allSettled(
        myJobs.map((job) =>
          request(
            "GET",
            `/applications/job/${job._id}`
          )
        )
      );

      const allApplications = [];

      groups.forEach((group) => {
        if (group.status === "fulfilled") {
          allApplications.push(
            ...listOf(
              group.value,
              "applications"
            ).map(normalizeApplication)
          );
        }
      });

      setApplications(allApplications);

      if (
        groups.some(
          (group) => group.status === "rejected"
        )
      ) {
        setError(
          "Some applicant lists could not be loaded."
        );
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setFormJob(null);
    setShowForm(true);
  };

  const openEdit = (job) => {
    setViewJob(null);
    setFormJob(job);
    setShowForm(true);
  };

  const openDelete = (job) => {
    setViewJob(null);
    setDeleteJob(job);
  };

  const removeJob = async () => {
    if (!deleteJob?._id) return;

    setDeleting(true);

    try {
      await request(
        "DELETE",
        `/jobs/${deleteJob._id}`
      );

      setNotice("Job deleted successfully.");
      setDeleteJob(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
      setDeleteJob(null);
    } finally {
      setDeleting(false);
    }
  };

  const updateStage = async (
    applicationId,
    newStatus
  ) => {
    setError("");

    try {
      await request(
        "PATCH",
        `/applications/${applicationId}/status`,
        { status: newStatus }
      );

      setNotice("Application status updated.");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const filteredJobs = jobs
    .filter((job) => {
      const searchText = [
        job.title,
        job.description,
        ...job.requirements,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query ||
          searchText.includes(query.toLowerCase())) &&
        (!location ||
          (job.location || "")
            .toLowerCase()
            .includes(location.toLowerCase())) &&
        (!status || job.status === status)
      );
    })
    .sort((a, b) => {
      if (sort === "title") {
        return a.title.localeCompare(b.title);
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="cf-skillmatch wrap">
      <div className="welcome">
        <div>
          <span className="eyebrow">
            CAREERFLOW / COMPANY
          </span>

          <h1>Welcome, {userName}!</h1>

          <p>
            Post opportunities, manage job listings
            and connect with talented candidates.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
        >
          <Plus size={18} />
          Post New Job
        </button>
      </div>

      {error && (
        <div className="error">{error}</div>
      )}

      {notice && (
        <div className="card">
          <p>{notice}</p>
          <button
            type="button"
            className="secondary"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid stats">
        <Stat
          icon={Briefcase}
          value={jobs.length}
          label="Total Jobs"
        />

        <Stat
          icon={Users}
          value={applications.length}
          label="Applications"
        />

        <Stat
          icon={CheckCircle}
          value={
            applications.filter((app) =>
              ["shortlisted", "interview", "offered"]
                .includes(app.status)
            ).length
          }
          label="Advanced Candidates"
        />
      </div>

      <h2>Manage Job Listings</h2>

      <div className="card filters">
        <div className="searchbox">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search jobs..."
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
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {loading ? (
        <Empty message="Loading job listings..." />
      ) : (
        <>
          <div className="cards">
            {visibleJobs.map((job) => (
              <div
                className="card jobcard"
                key={job._id}
              >
                <div className="row between">
                  <span
                    className={`status status-${job.status}`}
                  >
                    {job.status}
                  </span>

                  <small>
                    {job.createdAt
                      ? new Date(
                          job.createdAt
                        ).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                <h3>{job.title}</h3>

                <p>
                  <MapPin size={14} />{" "}
                  {job.location || "Not specified"}
                </p>

                <p className="clamp">
                  {job.description}
                </p>

                <Tags
                  items={job.requirements.slice(0, 5)}
                />

                <div className="row between jobactions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setViewJob(job)}
                  >
                    <Eye size={16} />
                    Details
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => openEdit(job)}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => openDelete(job)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!visibleJobs.length && (
            <Empty message="No job listings found." />
          )}

          <div className="pagination">
            <span>
              {filteredJobs.length} results · Page{" "}
              {currentPage} of {totalPages}
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
                disabled={currentPage === totalPages}
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

      {/* ======================================
          APPLICATION PIPELINE
          CLICKABLE APPLICANT NAMES
         ====================================== */}

      <h2>Application Pipeline</h2>

      <p>
        Click an applicant's name to view their
        full profile and contact information.
      </p>

      <div className="table card">
        <div className="tr apptr th">
          <span>Candidate</span>
          <span>Job</span>
          <span>Current Status</span>
          <span>Update Status</span>
        </div>

        {!applications.length && (
          <div className="tr">
            <span>No applications yet.</span>
          </div>
        )}

        {applications.map((app) => (
          <div
            className="tr apptr"
            key={app._id}
          >
            <span>
              <button
                type="button"
                onClick={() => setViewApplicant(app)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: "inherit",
                  fontWeight: 700,
                  textDecoration: "underline",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                title="View full applicant profile"
              >
                {app.student?.name || "Candidate"}
              </button>

              <small>
                {app.student?.field || ""}
                {app.student?.gpa != null
                  ? ` · GPA ${app.student.gpa}`
                  : ""}
              </small>
            </span>

            <span>
              <b>
                {app.internship?.title || "Job"}
              </b>
            </span>

            <span
              className={`status status-${app.status}`}
            >
              {app.status}
            </span>

            <span>
              {app.status === "withdrawn" ? (
                <small>Withdrawn</small>
              ) : (
                <select
                  value={app.status}
                  onChange={(e) =>
                    updateStage(
                      app._id,
                      e.target.value
                    )
                  }
                >
                  {STAGES.map((stage) => (
                    <option
                      key={stage}
                      value={stage}
                    >
                      {stage}
                    </option>
                  ))}
                </select>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT JOB */}

      {showForm && (
        <JobForm
          initial={formJob}
          onClose={() => setShowForm(false)}
          onSaved={async (message) => {
            setShowForm(false);
            setNotice(message);
            await load();
          }}
        />
      )}

      {/* JOB DETAILS */}

      {viewJob && (
        <JobDetails
          job={viewJob}
          onClose={() => setViewJob(null)}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      {/* APPLICANT PROFILE - NEW */}

      {viewApplicant && (
        <ApplicantProfile
          application={viewApplicant}
          onClose={() => setViewApplicant(null)}
        />
      )}

      {/* DELETE JOB CONFIRMATION */}

      {deleteJob && (
        <Modal
          title="Delete Job"
          onClose={() => setDeleteJob(null)}
        >
          <p>
            Are you sure you want to delete{" "}
            <b>{deleteJob.title}</b>?
          </p>

          <p className="muted">
            Associated applications may also be removed.
            This action cannot be undone.
          </p>

          <div className="row end">
            <button
              type="button"
              className="secondary"
              onClick={() => setDeleteJob(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              className="danger"
              disabled={deleting}
              onClick={removeJob}
            >
              {deleting
                ? "Deleting..."
                : "Delete Job"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
