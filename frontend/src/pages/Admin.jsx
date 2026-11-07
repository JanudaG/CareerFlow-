
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getSession } from "../lib/api";
import "./Admin.css";

const menuItems = [
  { icon: "▦", label: "Overview" },
  { icon: "👥", label: "Users" },
  { icon: "🏢", label: "Companies" },
  { icon: "💼", label: "Jobs" },
  { icon: "📄", label: "Applications" },
  { icon: "✨", label: "Match Reviews" },
];

export default function Admin() {
  const navigate = useNavigate();
  const user = getSession()?.user;

  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const response = await api.get("/admin/stats");
        if (active) setStats(response.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Statistics are not available yet."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const cards = [
    {
      title: "Job Seekers",
      value: stats?.totalJobSeekers,
      icon: "👥",
      color: "purple",
    },
    {
      title: "Companies",
      value: stats?.totalCompanies,
      icon: "🏢",
      color: "blue",
    },
    {
      title: "Total Jobs",
      value: stats?.totalJobs,
      icon: "💼",
      color: "pink",
    },
    {
      title: "Applications",
      value: stats?.totalApplications,
      icon: "📄",
      color: "green",
    },
  ];

  return (
    <div className="cf-admin">
      <aside className="cf-admin-sidebar">
        <div className="cf-admin-brand">
          <div className="cf-admin-brand-icon">✦</div>
          <div>
            <h2>CareerFlow</h2>
            <span>ADMIN PORTAL</span>
          </div>
        </div>

        <div className="cf-admin-menu-label">WORKSPACE</div>

        <nav className="cf-admin-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                activeTab === item.label ? "active" : ""
              }
              onClick={() => setActiveTab(item.label)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="cf-admin-sidebar-bottom">
          <div className="cf-admin-profile">
            <div className="cf-admin-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <strong>{user?.name || "Admin"}</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button
            className="cf-admin-logout"
            type="button"
            onClick={handleLogout}
          >
            ↪ Sign Out
          </button>
        </div>
      </aside>

      <main className="cf-admin-main">
        <header className="cf-admin-topbar">
          <div>
            <div className="cf-admin-breadcrumb">
              Admin Portal / {activeTab}
            </div>
            <h1>{activeTab}</h1>
            <p>
              {activeTab === "Overview"
                ? "Here's what's happening across your platform."
                : `Manage CareerFlow ${activeTab.toLowerCase()}.`}
            </p>
          </div>

          <div className="cf-admin-top-profile">
            <span className="cf-admin-online-dot" />
            Administrator
          </div>
        </header>

        {activeTab === "Overview" ? (
          <>
            <section className="cf-admin-welcome">
              <div>
                <span className="cf-admin-eyebrow">
                  ✨ CAREERFLOW ADMINISTRATION
                </span>
                <h2>
                  Welcome back, {user?.name || "Admin"}!
                </h2>
                <p>
                  Monitor your platform and manage the
                  recruitment workflow from one place.
                </p>
              </div>
              <div className="cf-admin-welcome-art">✦</div>
            </section>

            <div className="cf-admin-section-heading">
              <h2>Platform Overview</h2>
              <span>Live platform statistics</span>
            </div>

            {error && (
              <div className="cf-admin-error">{error}</div>
            )}

            <section className="cf-admin-stats">
              {cards.map((card) => (
                <div
                  className="cf-admin-stat-card"
                  key={card.title}
                >
                  <div
                    className={`cf-admin-stat-icon ${card.color}`}
                  >
                    {card.icon}
                  </div>

                  <p>{card.title}</p>

                  <h3>
                    {loading
                      ? "..."
                      : card.value !== undefined
                        ? card.value.toLocaleString()
                        : "—"}
                  </h3>

                  <span>Platform total</span>
                </div>
              ))}
            </section>

            <div className="cf-admin-section-heading">
              <h2>Management Center</h2>
              <span>Quick access to admin modules</span>
            </div>

            <section className="cf-admin-actions">
              {[
                {
                  icon: "👥",
                  title: "User Management",
                  description:
                    "View and manage registered users.",
                  tab: "Users",
                },
                {
                  icon: "💼",
                  title: "Job Management",
                  description:
                    "Review jobs across the platform.",
                  tab: "Jobs",
                },
                {
                  icon: "✨",
                  title: "Match Reviews",
                  description:
                    "Review and approve candidate matches.",
                  tab: "Match Reviews",
                },
              ].map((action) => (
                <button
                  type="button"
                  key={action.title}
                  className="cf-admin-action-card"
                  onClick={() => setActiveTab(action.tab)}
                >
                  <span className="cf-admin-action-icon">
                    {action.icon}
                  </span>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                  <span className="cf-admin-action-link">
                    Open module →
                  </span>
                </button>
              ))}
            </section>
          </>
        ) : (
          <section className="cf-admin-module">
            <div className="cf-admin-module-icon">🚀</div>
            <h2>{activeTab} Management</h2>
            
            <button
              type="button"
              onClick={() => setActiveTab("Overview")}
            >
              ← Back to Overview
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
