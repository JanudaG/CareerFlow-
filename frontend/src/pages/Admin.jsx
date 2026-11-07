
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "./Admin.css";

const endpoints = {
  Overview: "/admin/stats",
  Companies: "/admin/companies",
  "Job Seekers": "/admin/jobseekers",
  Jobs: "/admin/jobs",
  Applications: "/admin/applications",
};

const tabs = [
  "Overview",
  "Companies",
  "Job Seekers",
  "Jobs",
  "Applications",
  "Match Reviews",
];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!endpoints[tab]) {
      setData(null);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    setData(null);

    api.get(endpoints[tab])
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || "Failed to load data");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [tab]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const stats = [
    ["Job Seekers", data?.totalJobSeekers],
    ["Companies", data?.totalCompanies],
    ["Jobs", data?.totalJobs],
    ["Applications", data?.totalApplications],
  ];

  const getColumns = () => {
    switch (tab) {
      case "Companies":
        return ["companyName", "name", "email"];
      case "Job Seekers":
        return ["name", "email", "university", "degree", "field"];
      case "Jobs":
        return ["title", "location", "status"];
      case "Applications":
        return ["applicant", "job", "status"];
      default:
        return [];
    }
  };

  const formatValue = (item, field) => {
    if (field === "applicant") return item.applicant?.name || "—";
    if (field === "job") return item.job?.title || "—";
    return item[field] ?? "—";
  };

  return (
    <div className="simple-admin">
      <header className="simple-admin-header">
        <h2>CareerFlow Admin</h2>
      </header>

      <nav className="simple-admin-nav">
        {tabs.map((name) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>

      <main className="simple-admin-main">
        <h1>{tab}</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="simple-admin-error">{error}</p>}

        {!loading && !error && tab === "Overview" && (
          <div className="simple-admin-stats">
            {stats.map(([label, value]) => (
              <div className="simple-admin-card" key={label}>
                <p>{label}</p>
                <h2>{value ?? "—"}</h2>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && getColumns().length > 0 && (
          <div className="simple-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  {getColumns().map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(data) ? data : []).map((item) => (
                  <tr key={item._id}>
                    {getColumns().map((field) => (
                      <td key={field}>{formatValue(item, field)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {Array.isArray(data) && data.length === 0 && (
              <p>No records found.</p>
            )}
          </div>
        )}

        {tab === "Match Reviews" && (
          <p>Match approval feature will be added next.</p>
        )}
      </main>
    </div>
  );
}
