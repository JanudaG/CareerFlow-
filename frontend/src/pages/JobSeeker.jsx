import React, {
  useCallback,useEffect,useState,
} from "react";
import {Briefcase,X,Trash2,Undo2,Plus,Eye,Pencil,Search,ChevronLeft,ChevronRight,MapPin,GraduationCap,Send,Sparkles,
} from "lucide-react";
import { api, getSession } from "../lib/api.js";
import "./Dashboard.css";

const DEGREES = [
  "Certificate",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
];

const STAGES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
];

const EMPTY_PROFILE = {
  name: "",
  university: "",
  degree: "Bachelor",
  field: "",
  gpa: "",
  graduationYear: "",
  bio: "",
  experience: "",
  skills: [],
  resumeLink: "",
};

function getUserName() {
  const user = getSession()?.user || {};

  return (
    user.name ||
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ") ||
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
  const response = await api.request({
    method,
    url,
    data,
  });
  return unwrap(response);
}

function normalizeJob(job) {
  return {
    ...job,
    _id: job?._id || job?.id,
    requirements:
      job?.requirements || job?.requiredSkills || [],
    preferredDegree: job?.preferredDegree || "Any",
    preferredField: job?.preferredField || "",
    minimumGpa: job?.minimumGpa ?? "",
    openings: job?.openings ?? 1,
    closingDate: job?.closingDate
      ? String(job.closingDate).slice(0, 10)
      : "",
    status: job?.status || "open",
    company:
      job?.postedBy?.companyName ||
      job?.postedBy?.name ||
      job?.company?.companyName ||
      "Company",
  };
}

function normalizeApplication(app) {
  const job = app?.internship || app?.job;

  return {
    ...app,
    _id: app?._id || app?.id,
    internship: job ? normalizeJob(job) : null,
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
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
      >
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
// PROFILE FORM
// ================================================

function ProfileForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...EMPTY_PROFILE,
    ...initial,
    gpa: initial?.gpa ?? "",
    graduationYear: initial?.graduationYear ?? "",
    skills: initial?.skills || [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      form.skills.some(
        (skill) =>
          skill.toLowerCase() === value.toLowerCase()
      )
    ) {
      setSkillInput("");
      return;
    }

    set("skills", [...form.skills, value]);
    setSkillInput("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.field.trim()) {
      setError("Field of study is required.");
      return;
    }

    if (
      form.gpa !== "" &&
      (
        !Number.isFinite(Number(form.gpa)) ||
        Number(form.gpa) < 0 ||
        Number(form.gpa) > 4
      )
    ) {
      setError("GPA must be between 0 and 4.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        university: form.university.trim(),
        degree: form.degree,
        field: form.field.trim(),
        gpa:
          form.gpa === ""
            ? null
            : Number(form.gpa),
        graduationYear:
          form.graduationYear === ""
            ? null
            : Number(form.graduationYear),
        bio: form.bio.trim(),
        experience: form.experience.trim(),
        skills: form.skills,
        resumeLink: form.resumeLink.trim(),
      };

      const saved = await request(
        "PUT",
        "/profile",
        payload
      );

      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cf-skillmatch wrap">
      <div className="welcome">
        <div>
          <span className="eyebrow">
            CAREERFLOW / JOB SEEKER
          </span>

          <h1>Edit My Profile</h1>

          <p>
            Keep your qualifications and skills updated
            to improve your job recommendations.
          </p>
        </div>
      </div>

      <form
        className="card profileform stack"
        onSubmit={submit}
      >
        {error && <div className="error">{error}</div>}

        <div className="formgrid">
          <label>
            Full Name *
            <input
              required
              value={form.name}
              onChange={(e) =>
                set("name", e.target.value)
              }
            />
          </label>

          <label>
            University
            <input
              value={form.university}
              onChange={(e) =>
                set("university", e.target.value)
              }
              placeholder="University of Ruhuna"
            />
          </label>

          <label>
            Degree
            <select
              value={form.degree}
              onChange={(e) =>
                set("degree", e.target.value)
              }
            >
              {DEGREES.map((degree) => (
                <option
                  key={degree}
                  value={degree}
                >
                  {degree}
                </option>
              ))}
            </select>
          </label>

          <label>
            Field of Study *
            <input
              required
              value={form.field}
              onChange={(e) =>
                set("field", e.target.value)
              }
              placeholder="Computer Engineering"
            />
          </label>

          <label>
            GPA
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={form.gpa}
              onChange={(e) =>
                set("gpa", e.target.value)
              }
            />
          </label>

          <label>
            Graduation Year
            <input
              type="number"
              min="1900"
              max="2200"
              value={form.graduationYear}
              onChange={(e) =>
                set("graduationYear", e.target.value)
              }
            />
          </label>
        </div>

        <label>
          Professional Summary
          <textarea
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={(e) =>
              set("bio", e.target.value)
            }
            placeholder="Tell employers about yourself..."
          />
        </label>

        <label>
          Experience / Projects
          <textarea
            rows={3}
            maxLength={1500}
            value={form.experience}
            onChange={(e) =>
              set("experience", e.target.value)
            }
            placeholder="Describe your projects..."
          />
        </label>

        <label>
          Resume Link
          <input
            type="url"
            value={form.resumeLink}
            onChange={(e) =>
              set("resumeLink", e.target.value)
            }
            placeholder="https://..."
          />
        </label>

        <label>
          Skills
          <div className="row">
            <input
              value={skillInput}
              onChange={(e) =>
                setSkillInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="React, Python, SQL..."
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
          {form.skills.map((skill) => (
            <span key={skill}>
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                onClick={() =>
                  set(
                    "skills",
                    form.skills.filter(
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

          <button
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ================================================
// JOB DETAILS
// ================================================

function JobDetails({
  job,
  applied,
  onClose,
  onApply,
}) {
  return (
    <Modal title="Job Details" onClose={onClose}>
      <div className="stack">
        <span
          className={`status status-${job.status}`}
        >
          {job.status}
        </span>

        <h2>{job.title}</h2>

        <p>
          {job.company} ·{" "}
          {job.location || "Location not specified"}
        </p>

        <div className="detailgrid">
          <div>
            <small>Salary Range</small>
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
            <small>Preferred Degree</small>
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

        <h3>Job Description</h3>
        <p className="prewrap">{job.description}</p>

        <h3>Required Skills</h3>
        <Tags items={job.requirements} />

        <div className="row end">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            disabled={applied || job.status !== "open"}
            onClick={() => onApply(job)}
          >
            {applied ? "Already Applied" : "Apply Now"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ================================================
// APPLY MODAL
// ================================================

function ApplyModal({ job, onClose, onDone }) {
  const [coverNote, setCoverNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (coverNote.length > 1000) {
      setError("Cover note is too long.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await request(
        "POST",
        `/applications/${job._id}`,
        { coverNote: coverNote.trim() }
      );

      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Apply for ${job.title}`}
      onClose={onClose}
    >
      <form className="stack" onSubmit={submit}>
        <p>
          Company: <b>{job.company}</b>
        </p>

        {error && <div className="error">{error}</div>}

        <label>
          Cover Note (Optional)
          <textarea
            rows={5}
            maxLength={1000}
            value={coverNote}
            onChange={(e) =>
              setCoverNote(e.target.value)
            }
            placeholder="Explain why you are suitable..."
          />
        </label>

        <small>
          {coverNote.length}/1000 characters
        </small>

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
            disabled={saving}
          >
            <Send size={16} />
            {saving ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ================================================
// SMART MATCH CARD
// ================================================

function MatchCard({ match, applied, onApply }) {
  const job = normalizeJob(
    match.job || match.internship || {}
  );

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
        <span className="status">
          SKILL MATCH
        </span>

        <h3>{job.title}</h3>

        <p>
          {job.company} · {job.location}
        </p>

        <p>
          Matched skills:
        </p>

        <Tags items={match.matchedSkills || []} />

        {!!match.missingSkills?.length && (
          <small>
            Skills to develop:{" "}
            {match.missingSkills.join(", ")}
          </small>
        )}

        <div className="row">
          <button
            type="button"
            disabled={applied || job.status !== "open"}
            onClick={() => onApply(job)}
          >
            {applied ? "Applied" : "Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================
// JOB SEEKER DASHBOARD
// ================================================

export default function JobSeeker() {
  const userName = getUserName();

  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [viewJob, setViewJob] = useState(null);
  const [applyJob, setApplyJob] = useState(null);

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [degree, setDegree] = useState("");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      request("GET", "/profile"),
      request("GET", "/jobs"),
      request("GET", "/applications/mine"),
      request("GET", "/matches/mine"),
    ]);

    const [
      profileResult,
      jobsResult,
      applicationsResult,
      matchesResult,
    ] = results;

    if (profileResult.status === "fulfilled") {
      setProfile(profileResult.value);
    }

    if (jobsResult.status === "fulfilled") {
      setJobs(
        listOf(jobsResult.value, "jobs")
          .map(normalizeJob)
      );
    }

    if (applicationsResult.status === "fulfilled") {
      setApplications(
        listOf(
          applicationsResult.value,
          "applications"
        ).map(normalizeApplication)
      );
    }

    if (matchesResult.status === "fulfilled") {
      setMatches(
        listOf(matchesResult.value, "matches")
      );
    }

    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => errorMessage(result.reason));

    if (failures.length) {
      setError(
        `Some data could not be loaded: ${[
          ...new Set(failures),
        ].join(" ")}`
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startApply = (job) => {
    setViewJob(null);
    setApplyJob(job);
  };

  const withdraw = async (applicationId) => {
    if (
      !window.confirm(
        "Are you sure you want to withdraw this application?"
      )
    ) {
      return;
    }

    try {
      await request(
        "PATCH",
        `/applications/${applicationId}/withdraw`
      );

      setNotice("Application withdrawn successfully.");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (applicationId) => {
    if (
      !window.confirm(
        "Delete this withdrawn application permanently?"
      )
    ) {
      return;
    }

    try {
      await request(
        "DELETE",
        `/applications/${applicationId}`
      );

      setNotice("Application deleted successfully.");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const appliedIds = applications
    .map((app) => app.internship?._id)
    .filter(Boolean);

  const filteredJobs = jobs
    .filter((job) => {
      const text = [
        job.title,
        job.description,
        job.company,
        ...job.requirements,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query ||
          text.includes(query.toLowerCase())) &&
        (!location ||
          (job.location || "")
            .toLowerCase()
            .includes(location.toLowerCase())) &&
        (!degree ||
          job.preferredDegree === "Any" ||
          job.preferredDegree === degree) &&
        (!status || job.status === status)
      );
    })
    .sort((a, b) => {
      if (sort === "title") {
        return a.title.localeCompare(b.title);
      }

      const first = new Date(a.createdAt || 0).getTime();
      const second = new Date(b.createdAt || 0).getTime();

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

  if (editing) {
    return (
      <ProfileForm
        initial={{
          ...EMPTY_PROFILE,
          ...(profile || {}),
          name: profile?.name || userName,
        }}
        onClose={() => setEditing(false)}
        onSaved={(saved) => {
          setProfile(saved);
          setEditing(false);
          setNotice("Profile saved successfully.");
          load();
        }}
      />
    );
  }

  return (
    <div className="cf-skillmatch wrap">
      <div className="welcome">
        <div>
          <span className="eyebrow">
            CAREERFLOW / JOB SEEKER
          </span>

          <h1>
            Welcome, {profile?.name || userName}!
          </h1>

          <p>
            Explore job opportunities, track your
            applications and discover career matches.
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
          icon={GraduationCap}
          value={
            profile?.gpa != null
              ? `${profile.gpa}/4`
              : "—"
          }
          label="Current GPA"
        />

        <Stat
          icon={Sparkles}
          value={profile?.skills?.length || 0}
          label="Skills Listed"
        />

        <Stat
          icon={Briefcase}
          value={applications.length}
          label="Applications"
        />
      </div>

      <h2>Application Tracker</h2>

      <div className="tracker">
        {applications.length ? (
          applications.map((app) => {
            const stage = STAGES.indexOf(app.status);

            return (
              <div
                className="card application"
                key={app._id}
              >
                <div>
                  <span
                    className={`status status-${app.status}`}
                  >
                    {app.status}
                  </span>

                  <h3>
                    {app.internship?.title ||
                      "Job"}
                  </h3>

                  <p>
                    {app.internship?.company ||
                      "Company"}
                  </p>

                  <small>
                    Updated:{" "}
                    {app.updatedAt
                      ? new Date(
                          app.updatedAt
                        ).toLocaleDateString()
                      : "Recently"}
                  </small>
                </div>

                <div>
                  <div className="stagebar">
                    {STAGES.map((item, index) => (
                      <i
                        key={item}
                        title={item}
                        className={
                          stage >= index ? "done" : ""
                        }
                      />
                    ))}
                  </div>

                  <div className="row end appactions">
                    {![
                      "withdrawn",
                      "rejected",
                      "offered",
                    ].includes(app.status) && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          withdraw(app._id)
                        }
                      >
                        <Undo2 size={16} />
                        Withdraw
                      </button>
                    )}

                    {app.status === "withdrawn" && (
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          remove(app._id)
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <Empty
            message="No applications yet. Apply for a job to start tracking."
          />
        )}
      </div>

      <h2>Your Smart Matches</h2>

      <div className="cards">
        {matches.length ? (
          matches.map((match) => {
            const job = match.job || match.internship;
            const jobId = job?._id || job?.id;

            return (
              <MatchCard
                key={match._id || jobId}
                match={match}
                applied={appliedIds.includes(jobId)}
                onApply={startApply}
              />
            );
          })
        ) : (
          <Empty
            message="No matching jobs found. Add skills to your profile to improve recommendations."
          />
        )}
      </div>

      <h2>Explore Open Jobs</h2>

      <div className="card filters">
        <div className="searchbox">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search jobs or skills..."
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
          <option value="">All Degrees</option>
          {DEGREES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

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
          onChange={(e) =>
            setSort(e.target.value)
          }
        >
          <option value="newest">
            Newest First
          </option>
          <option value="oldest">
            Oldest First
          </option>
          <option value="title">
            Title A-Z
          </option>
        </select>
      </div>

      {loading ? (
        <Empty message="Loading jobs..." />
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
                  <MapPin size={14} />
                  {" "}
                  {job.company} ·{" "}
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
                    disabled={
                      appliedIds.includes(job._id) ||
                      job.status !== "open"
                    }
                    onClick={() => startApply(job)}
                  >
                    {appliedIds.includes(job._id)
                      ? "Applied"
                      : "Apply"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!visibleJobs.length && (
            <Empty
              message="No jobs match your filters."
            />
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

      {viewJob && (
        <JobDetails
          job={viewJob}
          applied={appliedIds.includes(viewJob._id)}
          onClose={() => setViewJob(null)}
          onApply={startApply}
        />
      )}

      {applyJob && (
        <ApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onDone={async () => {
            setApplyJob(null);
            setNotice("Application submitted successfully.");
            await load();
          }}
        />
      )}
    </div>
  );
}
