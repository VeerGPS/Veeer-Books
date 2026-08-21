"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ADMIN_PASSWORD } from "@/lib/admin";

type SubmissionItem = {
  _id: string;
  submissionId: string;
  title: string;
  penName: string;
  category: string;
  desiredPrice: number;
  status: string;
  currentRevision: number;
  createdAt: string;
  updatedAt: string;
  coverFile?: { storagePath?: string };
  manuscriptFile?: { storagePath?: string; originalName?: string };
  publishedBookSlug?: string;
};

export default function AdminPublishingDashboard() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
      setError("");
      void loadSubmissions();
    } else {
      setError("Incorrect admin password.");
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/publishing/submissions", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString(), {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submissions");

      setSubmissions(data.submissions || []);
      setCounts(data.counts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      void loadSubmissions();
    }
  }, [authorized, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Published</span>;
      case "UNDER_REVIEW":
        return <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Under Review</span>;
      case "CHANGES_REQUESTED":
        return <span style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Changes Requested</span>;
      case "APPROVED":
        return <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Approved</span>;
      case "FORMATTING":
        return <span style={{ backgroundColor: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>In Formatting</span>;
      case "QUALITY_CHECK":
        return <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Quality Check</span>;
      case "READY_TO_PUBLISH":
        return <span style={{ backgroundColor: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Ready to Publish</span>;
      case "RESUBMITTED":
        return <span style={{ backgroundColor: "#e0e7ff", color: "#4338ca", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Resubmitted</span>;
      case "SUBMITTED":
        return <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>New Submitted</span>;
      default:
        return <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Draft</span>;
    }
  };

  if (!authorized) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem 4rem", color: "#0f172a" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Admin Publishing Hub</h1>
          <p style={{ color: "#475569", marginBottom: "1.5rem", textAlign: "center" }}>Enter password to access manuscript editorial review and publishing workflows.</p>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
            />
          </div>
          {error && <p style={{ color: "#dc2626", marginBottom: "1rem", fontWeight: 500 }}>{error}</p>}
          <button className="btn btn-primary btn-full" onClick={unlock} style={{ padding: "0.85rem", fontWeight: 600 }}>
            Enter Publishing Hub
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "5rem 1rem 4rem", color: "#0f172a" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "2px solid #e2e8f0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>Editorial Publishing Hub</h1>
              <span className="meta-pill" style={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 700 }}>
                Admin Gatekeeper Mode
              </span>
            </div>
            <p style={{ color: "#475569", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
              Review author submissions, format manuscripts, verify reader quality, and publish books to the storefront.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Link href="/admin/publishing/sales" className="btn btn-outline btn-sm" style={{ backgroundColor: "#ffffff" }}>
              💰 Marketplace Sales
            </Link>
            <Link href="/admin/publishing/settings" className="btn btn-outline btn-sm" style={{ backgroundColor: "#ffffff" }}>
              ⚙️ Platform Settings
            </Link>
            <Link href="/admin" className="btn btn-outline btn-sm" style={{ backgroundColor: "#ffffff" }}>
              📚 Store Catalogue Hub
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => void loadSubmissions()} disabled={loading}>
              {loading ? "Refreshing..." : "🔄 Refresh Queue"}
            </button>
          </div>
        </div>

        {/* Status Queue Tabs */}
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.75rem" }}>
          {[
            { id: "ALL", label: `All (${counts.all || 0})` },
            { id: "NEW", label: `⚡ New Submissions (${counts.new || 0})` },
            { id: "UNDER_REVIEW", label: `🧐 Under Review (${counts.underReview || 0})` },
            { id: "CHANGES_REQUESTED", label: `⚠️ Changes Requested (${counts.changesRequested || 0})` },
            { id: "APPROVED", label: `✅ Approved (${counts.approved || 0})` },
            { id: "FORMATTING", label: `🛠️ In Formatting (${counts.formatting || 0})` },
            { id: "QUALITY_CHECK", label: `🔍 Quality Check (${counts.qualityCheck || 0})` },
            { id: "READY_TO_PUBLISH", label: `🚀 Ready to Publish (${counts.readyToPublish || 0})` },
            { id: "PUBLISHED", label: `✨ Live Published (${counts.published || 0})` },
            { id: "REJECTED", label: `❌ Rejected (${counts.rejected || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: statusFilter === tab.id ? "#0f172a" : "#ffffff",
                color: statusFilter === tab.id ? "#ffffff" : "#0f172a",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.75rem" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loadSubmissions()}
            placeholder="Search by Title, Pen Name, Category, or Submission ID (e.g. VSB-SUB-1001)..."
            style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
          />
          <button className="btn btn-outline" onClick={() => void loadSubmissions()}>
            Search
          </button>
        </div>

        {/* Submissions Queue Table */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
          {submissions.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              {loading ? "Loading queue..." : "No submissions found matching this filter."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Code</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Book Title</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Author</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Category</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Price</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Status</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Date</th>
                    <th style={{ padding: "12px 16px", color: "#475569", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#b45309" }}>{s.submissionId}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                        <Link href={`/admin/publishing/${s._id}`} style={{ color: "#0f172a", textDecoration: "none" }}>
                          {s.title}
                        </Link>
                        {s.currentRevision > 1 && (
                          <span style={{ marginLeft: "6px", fontSize: "0.75rem", backgroundColor: "#e0e7ff", color: "#4338ca", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            Rev #{s.currentRevision}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>{s.penName}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{s.category}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>₹{s.desiredPrice}</td>
                      <td style={{ padding: "12px 16px" }}>{getStatusBadge(s.status)}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>
                        {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <Link
                          href={`/admin/publishing/${s._id}`}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: "#cbd5e1", backgroundColor: "#ffffff" }}
                        >
                          Review & Actions →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
