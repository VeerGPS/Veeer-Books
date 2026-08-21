"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import PublishingAgreementDocument from "@/components/PublishingAgreementDocument";

type DashboardData = {
  hasProfile: boolean;
  profile: any;
  metrics: {
    totalBooks: number;
    totalSubmissions: number;
    draftCount: number;
    submittedCount: number;
    underReviewCount: number;
    changesRequestedCount: number;
    approvedCount: number;
    publishedSubmissionsCount: number;
    totalSalesCount: number;
    totalGrossRevenue: number;
    totalPlatformCommission: number;
    totalAuthorEarnings: number;
    pendingSettlement: number;
    settledAmount: number;
    activeCommissionRate?: number;
    isAgreementAccepted?: boolean;
    agreementVersion?: string;
  };
  submissions: any[];
  publishedBooks: any[];
  salesLedger: any[];
  notifications: any[];
  platformSettings?: any;
  agreementStatus?: {
    isAccepted: boolean;
    acceptedRecord: any;
    activeAgreement: any;
  };
};

export default function AuthorDashboardPage() {
  const router = useRouter();
  const { isLoggedIn, token, isReady, refreshAuthorStatus } = useAuth();
  const { show } = useModal();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "books"
    | "submissions"
    | "sales"
    | "profile"
    | "notifications"
    | "agreement"
    | "help"
  >("overview");

  const [acceptingAgreement, setAcceptingAgreement] = useState(false);
  const [agreementMessage, setAgreementMessage] = useState("");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [modalAgreementChecked, setModalAgreementChecked] = useState(false);

  // Profile setup form state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    penName: "",
    country: "India",
    phone: "",
    website: "",
    biography: "",
    profilePhoto: "",
    authorType: "Individual Author",
    twitter: "",
    instagram: "",
    linkedin: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/author/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.profile) {
          setProfileForm({
            fullName: json.profile.fullName || "",
            penName: json.profile.penName || "",
            country: json.profile.country || "India",
            phone: json.profile.phone || "",
            website: json.profile.website || "",
            biography: json.profile.biography || "",
            profilePhoto: json.profile.profilePhoto || "",
            authorType: json.profile.authorType || "Individual Author",
            twitter: json.profile.socialLinks?.twitter || "",
            instagram: json.profile.socialLinks?.instagram || "",
            linkedin: json.profile.socialLinks?.linkedin || "",
          });
        }
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    if (isLoggedIn && token) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token, isReady]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileMessage("");

    try {
      const res = await fetch("/api/author/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          penName: profileForm.penName,
          country: profileForm.country,
          phone: profileForm.phone,
          website: profileForm.website,
          biography: profileForm.biography,
          profilePhoto: profileForm.profilePhoto,
          authorType: profileForm.authorType,
          socialLinks: {
            twitter: profileForm.twitter,
            instagram: profileForm.instagram,
            linkedin: profileForm.linkedin,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save profile");

      await refreshAuthorStatus();
      setProfileMessage("✅ Author profile saved successfully!");
      await loadDashboard();
    } catch (err) {
      setProfileMessage(`❌ ${err instanceof Error ? err.message : "Failed to save profile"}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAcceptAgreement = async () => {
    if (!token) return;
    setAcceptingAgreement(true);
    setAgreementMessage("");
    try {
      const activeVersion = data?.agreementStatus?.activeAgreement?.version || "VSB-DPA-1.0";
      const res = await fetch("/api/author/agreement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agreementVersion: activeVersion,
          rightsConfirmed: true,
          accurateInfoConfirmed: true,
          acceptanceType: "dashboard_standalone",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to record agreement acceptance");

      setAgreementMessage("✅ Digital Publishing Agreement accepted successfully!");
      setShowAcceptModal(false);
      await loadDashboard();
    } catch (err) {
      setAgreementMessage(`❌ ${err instanceof Error ? err.message : "Failed to accept agreement"}`);
    } finally {
      setAcceptingAgreement(false);
    }
  };

  if (!isReady || loading) {
    return (
      <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading Author Dashboard...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="container" style={{ padding: "6rem 1rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "2.5rem", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", marginBottom: "1rem" }}>Author Dashboard</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Please sign in to access your publishing workspace, book submissions, and earnings.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => show("login")}>Sign In</button>
            <button className="btn btn-outline" onClick={() => show("signup")}>Sign Up as Author</button>
          </div>
        </div>
      </main>
    );
  }

  // Screen if user has not yet created an author profile
  if (data && (!data.hasProfile || !data.profile)) {
    return (
      <main className="container" style={{ padding: "6rem 1rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "2.75rem 2rem", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 4px 25px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>✍️</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.85rem", marginBottom: "0.75rem", color: "var(--text-main)" }}>
            Author Account Required
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6, fontSize: "0.98rem" }}>
            You are currently signed in as a reader. To submit manuscripts, view sales ledger entries, and access the Author Hub, please set up your author profile.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/author/setup" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", fontWeight: 700 }}>
              Set Up Author Profile →
            </Link>
            <Link href="/publish" className="btn btn-outline" style={{ padding: "0.75rem 1.5rem" }}>
              Learn About Publishing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { profile, metrics, submissions = [], publishedBooks = [], salesLedger = [], notifications = [], platformSettings } = data || {};

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
        return <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Ready to Publish</span>;
      case "REJECTED":
        return <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Rejected</span>;
      default:
        return <span style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Submitted</span>;
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "3.5rem 1rem 5rem" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        
        {/* Author Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.25rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "var(--accent-dark)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--serif)" }}>
              {(profile?.penName || "A")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.85rem", margin: 0, color: "var(--text-main)" }}>
                  {profile?.penName}
                </h1>
                <span
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor: profile?.status === "active" ? "#f0fdf4" : profile?.status === "pending" ? "#fffbeb" : "#fef2f2",
                    color: profile?.status === "active" ? "#15803d" : profile?.status === "pending" ? "#b45309" : "#b91c1c",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: 700,
                  }}
                >
                  {profile?.status === "active" ? "Active Author" : profile?.status === "pending" ? "Pending Approval" : "Suspended"}
                </span>
              </div>
              <p style={{ color: "var(--text-muted)", margin: "0.2rem 0 0 0", fontSize: "0.9rem" }}>
                {profile?.email} • {profile?.country || "India"} • {profile?.authorType}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/author/publish/new" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", fontWeight: 700 }}>
              + Submit New Book
            </Link>
            {profile?.slug && (
              <Link href={`/author/${profile.slug}`} target="_blank" className="btn btn-outline" style={{ padding: "0.75rem 1.25rem" }}>
                Public Profile ↗
              </Link>
            )}
          </div>
        </div>

        {/* Dashboard Tabs Bar */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "0.75rem",
            marginBottom: "2rem",
            borderBottom: "2px solid #e2e8f0",
            maxWidth: "100%",
            scrollbarWidth: "thin",
          }}
        >
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "submissions", label: `📚 Submissions (${submissions.length})` },
            { id: "books", label: `📖 Published Books (${publishedBooks.length})` },
            { id: "sales", label: "💰 Sales & Royalties" },
            { id: "profile", label: "👤 Profile Settings" },
            { id: "notifications", label: `🔔 Alerts (${notifications.filter((n: any) => !n.isRead).length})` },
            { id: "agreement", label: "📜 Publishing Agreement" },
            { id: "help", label: "❓ Guidelines & Help" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                background: activeTab === tab.id ? "var(--accent-dark)" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "var(--text-main)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: "0.92rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div>
            {/* Top Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Submissions</span>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--text-main)" }}>
                  {metrics?.totalSubmissions || 0}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{metrics?.underReviewCount || 0} in editorial review</span>
              </div>

              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Live Published Books</span>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.25rem", color: "#15803d" }}>
                  {publishedBooks.length}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Available in store</span>
              </div>

              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Copies Sold</span>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--text-main)" }}>
                  {metrics?.totalSalesCount || 0}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Across all published titles</span>
              </div>

              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Author Royalties</span>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--accent-dark)" }}>
                  ₹{(metrics?.totalAuthorEarnings || 0).toFixed(2)}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>85% author revenue share</span>
              </div>
            </div>

            {/* Quick Actions & Recent Submissions */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.75rem", alignItems: "start" }}>
              
              {/* Recent Submissions Card */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.25rem", margin: 0 }}>Recent Book Submissions</h3>
                  <button onClick={() => setActiveTab("submissions")} style={{ background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}>
                    View All ({submissions.length}) →
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", backgroundColor: "var(--bg-paper)", borderRadius: "12px" }}>
                    <p style={{ color: "var(--text-muted)", margin: "0 0 1.25rem 0" }}>
                      You haven't submitted any books for publication yet.
                    </p>
                    <Link href="/author/publish/new" className="btn btn-primary btn-sm">
                      Submit Your First Book
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {submissions.slice(0, 4).map((sub) => (
                      <div key={sub._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.9rem", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: "#fafaf9" }}>
                        <div>
                          <Link href={`/author/submissions/${sub._id}`} style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem", textDecoration: "none" }}>
                            {sub.title}
                          </Link>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {sub.category} • ₹{sub.desiredPrice} • Submitted {new Date(sub.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {getStatusBadge(sub.status)}
                          <Link href={`/author/submissions/${sub._id}`} className="btn btn-outline btn-sm" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Author Toolkit Card */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", margin: "0 0 1rem 0" }}>Author Toolkit</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <Link href="/author/publish/new" className="btn btn-primary btn-full btn-sm">
                      + Submit New Manuscript
                    </Link>
                    <Link href="/publishing-agreement" target="_blank" className="btn btn-outline btn-full btn-sm">
                      📜 View Publishing Agreement
                    </Link>
                    {profile?.slug && (
                      <Link href={`/author/${profile.slug}`} target="_blank" className="btn btn-outline btn-full btn-sm">
                        🌐 View Your Author Page
                      </Link>
                    )}
                  </div>
                </div>

                <div style={{ backgroundColor: "#fbf9f5", padding: "1.5rem", borderRadius: "14px", border: "1px solid #fae8c8" }}>
                  <strong style={{ display: "block", color: "var(--accent-dark)", marginBottom: "0.3rem", fontSize: "0.95rem" }}>
                    💡 Publishing Tip
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350f", lineHeight: 1.5 }}>
                    Clean chapters and high-resolution book cover artwork (1600x2400px) speed up the editorial formatting and approval workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SUBMISSIONS LIST ─────────────────────────────────── */}
        {activeTab === "submissions" && (
          <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", margin: 0 }}>Manuscript Submissions</h2>
                <p style={{ color: "var(--text-muted)", margin: "0.2rem 0 0 0", fontSize: "0.9rem" }}>
                  Track review progress, editorial feedback, and formatting milestones for your books.
                </p>
              </div>
              <Link href="/author/publish/new" className="btn btn-primary btn-sm">
                + New Submission
              </Link>
            </div>

            {submissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", backgroundColor: "var(--bg-paper)", borderRadius: "12px" }}>
                <h3 style={{ fontFamily: "var(--serif)", marginBottom: "0.5rem" }}>No submissions yet</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  Submit your manuscript in EPUB, DOCX, or PDF to begin the publishing workflow.
                </p>
                <Link href="/author/publish/new" className="btn btn-primary">
                  Submit Manuscript Now →
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "var(--text-muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "10px 12px" }}>Book Title</th>
                      <th style={{ padding: "10px 12px" }}>Category</th>
                      <th style={{ padding: "10px 12px" }}>Price</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px" }}>Date</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "12px" }}>
                          <Link href={`/author/submissions/${s._id}`} style={{ fontWeight: 700, color: "var(--text-main)", textDecoration: "none" }}>
                            {s.title}
                          </Link>
                          {s.subtitle && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.subtitle}</div>}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>{s.category}</td>
                        <td style={{ padding: "12px", fontWeight: 700 }}>₹{s.desiredPrice}</td>
                        <td style={{ padding: "12px" }}>{getStatusBadge(s.status)}</td>
                        <td style={{ padding: "12px", color: "#64748b" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                            <Link href={`/author/submissions/${s._id}`} className="btn btn-outline btn-sm" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                              View
                            </Link>
                            {s.status === "CHANGES_REQUESTED" && (
                              <Link href={`/author/submissions/${s._id}/edit`} className="btn btn-sm" style={{ backgroundColor: "#dc2626", color: "#ffffff", padding: "4px 8px", fontSize: "0.8rem" }}>
                                Edit & Resubmit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PUBLISHED BOOKS ─────────────────────────────────── */}
        {activeTab === "books" && (
          <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Live Published Books</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              These books have completed editorial formatting and are live in the Veeer Sukhadiya Books store.
            </p>

            {publishedBooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", backgroundColor: "var(--bg-paper)", borderRadius: "12px" }}>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>
                  You do not have any live published books on the store yet. Once a submission is approved and formatted, it will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
                {publishedBooks.map((book) => (
                  <div key={book._id || book.id} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
                    <div style={{ width: "100%", height: 220, position: "relative", borderRadius: "8px", overflow: "hidden", marginBottom: "0.75rem", backgroundColor: "var(--bg-paper-dark)" }}>
                      <Image
                        src={book.coverUrl || book.coverImage || "/images/default-book.svg"}
                        alt={book.title}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>{book.title}</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>₹{book.price} • {book.category}</span>
                    <div style={{ marginTop: "auto", display: "flex", gap: "0.4rem" }}>
                      <Link href={`/product/${book.slug}`} target="_blank" className="btn btn-outline btn-sm btn-full" style={{ fontSize: "0.8rem", padding: "4px" }}>
                        Store Page ↗
                      </Link>
                      <Link href={`/reader/${book.slug}`} target="_blank" className="btn btn-primary btn-sm btn-full" style={{ fontSize: "0.8rem", padding: "4px" }}>
                        Open Reader 📖
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: SALES & REVENUE LEDGER ──────────────────────────── */}
        {activeTab === "sales" && (
          <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Sales & Revenue Ledger</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Active Platform Revenue Share: <strong>{100 - (metrics?.activeCommissionRate || 15)}% Author Share</strong> ({metrics?.activeCommissionRate || 15}% platform commission)
            </p>

            {salesLedger.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", backgroundColor: "var(--bg-paper)", borderRadius: "12px" }}>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>
                  No customer book purchases recorded yet. Your sales revenue and settled amounts will populate automatically.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "10px 14px" }}>Order ID</th>
                      <th style={{ padding: "10px 14px" }}>Book Title</th>
                      <th style={{ padding: "10px 14px" }}>Gross Price</th>
                      <th style={{ padding: "10px 14px" }}>Platform Fee</th>
                      <th style={{ padding: "10px 14px" }}>Author Net</th>
                      <th style={{ padding: "10px 14px" }}>Settlement</th>
                      <th style={{ padding: "10px 14px" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesLedger.map((sale: any) => (
                      <tr key={sale._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "0.85rem" }}>{sale.orderId}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{sale.bookTitle}</td>
                        <td style={{ padding: "10px 14px" }}>₹{sale.grossAmount?.toFixed(2)}</td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>-₹{sale.platformCommission?.toFixed(2)} ({sale.commissionPercent}%)</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: "#15803d" }}>+₹{sale.authorShare?.toFixed(2)}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: sale.settlementStatus === "settled" ? "#dcfce7" : "#fef3c7", color: sale.settlementStatus === "settled" ? "#15803d" : "#b45309" }}>
                            {sale.settlementStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{new Date(sale.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: PROFILE SETTINGS ────────────────────────────────── */}
        {activeTab === "profile" && (
          <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Author Profile Settings</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
              Public profile fields are visible to readers on your public author page.
            </p>

            <form onSubmit={handleSaveProfile}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-dark)" }}>👤 Public Author Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label>Legal Full Name</label>
                  <input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Pen Name / Public Name *</label>
                  <input required value={profileForm.penName} onChange={(e) => setProfileForm({ ...profileForm, penName: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label>Biography (Markdown supported)</label>
                <textarea rows={4} value={profileForm.biography} onChange={(e) => setProfileForm({ ...profileForm, biography: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label>Website</label>
                  <input value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Profile Photo URL</label>
                  <input value={profileForm.profilePhoto} onChange={(e) => setProfileForm({ ...profileForm, profilePhoto: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label>Twitter / X</label>
                  <input value={profileForm.twitter} onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })} placeholder="@username" />
                </div>
                <div className="form-group">
                  <label>Instagram</label>
                  <input value={profileForm.instagram} onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })} placeholder="@username" />
                </div>
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input value={profileForm.linkedin} onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              {profileMessage && <p style={{ marginBottom: "1rem", fontWeight: 600 }}>{profileMessage}</p>}

              <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ padding: "0.85rem 2rem", fontWeight: 700 }}>
                {savingProfile ? "Saving Changes..." : "Save Profile Information"}
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 6: NOTIFICATIONS ───────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "1.5rem" }}>In-App Notifications</h2>
            {notifications.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>No notifications right now.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {notifications.map((n: any) => (
                  <div key={n._id} style={{ padding: "1rem", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: n.isRead ? "#ffffff" : "#fbf9f5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>{n.title}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>{n.message}</p>
                    {n.link && (
                      <Link href={n.link} style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 700 }}>
                        View Details →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 7: PUBLISHING AGREEMENT DOCUMENT VIEWER ─────────────── */}
        {activeTab === "agreement" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            
            {/* Agreement Status Card */}
            <div
              style={{
                backgroundColor: data?.agreementStatus?.isAccepted ? "#f0fdf4" : "#fffbeb",
                border: `1.5px solid ${data?.agreementStatus?.isAccepted ? "#86efac" : "#fde047"}`,
                borderRadius: "16px",
                padding: "1.5rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1.25rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: data?.agreementStatus?.isAccepted ? "#15803d" : "#b45309",
                  }}
                >
                  AGREEMENT STATUS
                </span>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    margin: "0.2rem 0",
                    color: data?.agreementStatus?.isAccepted ? "#15803d" : "#92400e",
                    fontFamily: "var(--serif)",
                  }}
                >
                  {data?.agreementStatus?.isAccepted ? "✓ Accepted" : "⚠️ Not Yet Accepted"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.92rem", color: data?.agreementStatus?.isAccepted ? "#166534" : "#78350f" }}>
                  {data?.agreementStatus?.isAccepted ? (
                    <>
                      Agreement Version: <strong>{data.agreementStatus.acceptedRecord?.agreementVersion || "VSB-DPA-1.0"}</strong> • Accepted On:{" "}
                      <strong>
                        {data.agreementStatus.acceptedRecord?.acceptedAt
                          ? new Date(data.agreementStatus.acceptedRecord.acceptedAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Verified"}
                      </strong>
                    </>
                  ) : (
                    "Please review the Publishing Agreement before submitting a book."
                  )}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                {!data?.agreementStatus?.isAccepted ? (
                  <button
                    onClick={() => {
                      setModalAgreementChecked(false);
                      setShowAcceptModal(true);
                    }}
                    disabled={acceptingAgreement}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, padding: "0.7rem 1.5rem" }}
                  >
                    ✓ Accept Agreement ({data?.agreementStatus?.activeAgreement?.version || "VSB-DPA-1.0"})
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn btn-sm"
                    style={{
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                      border: "1px solid #86efac",
                      fontWeight: 700,
                      padding: "0.7rem 1.5rem",
                      cursor: "default",
                      opacity: 1,
                    }}
                  >
                    ✓ Agreement Accepted
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm"
                  style={{ backgroundColor: "#ffffff", borderColor: "var(--border)", padding: "0.7rem 1.25rem" }}
                >
                  🖨️ Print / Save as PDF
                </button>
              </div>
            </div>

            {agreementMessage && (
              <div
                style={{
                  padding: "0.85rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  backgroundColor: agreementMessage.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
                  color: agreementMessage.startsWith("✅") ? "#15803d" : "#dc2626",
                  border: `1px solid ${agreementMessage.startsWith("✅") ? "#86efac" : "#fca5a5"}`,
                }}
              >
                {agreementMessage}
              </div>
            )}

            {/* Document Viewer Paper Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                padding: "3rem 2.5rem",
                boxShadow: "0 4px 25px rgba(0,0,0,0.03)",
              }}
            >
              <PublishingAgreementDocument
                version={data?.agreementStatus?.activeAgreement?.version || "VSB-DPA-1.0"}
                lastUpdated="August 2026"
              />
            </div>
          </div>
        )}

        {/* ─── TAB 8: HELP ────────────────────────────────────────────── */}
        {activeTab === "help" && (
          <div style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.75rem", marginBottom: "1rem" }}>Author Help & Guidelines</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="policy-card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                <h3>📖 How Manuscript Conversion Works</h3>
                <p>
                  You submit your manuscript in PDF, Word (.docx), EPUB, or Text format. Our editorial team manually verifies, formats, and transforms your chapters into an interactive browser eBook reader with custom font sizing, night, and sepia modes.
                </p>
              </div>

              <div className="policy-card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                <h3>💳 How You Get Paid</h3>
                <p>
                  When readers purchase your book, the transaction is verified and logged in your author revenue ledger. Your net author share (Gross Price minus Platform Commission) accumulates in your account and is settled according to our platform schedule.
                </p>
              </div>

              <div className="policy-card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                <h3>📩 Need Help or Editorial Assistance?</h3>
                <p>
                  Reach out directly to our publishing team at <strong>veeersukhadiyabooks95@gmail.com</strong> or WhatsApp <strong>+91-6351440242</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── ACCEPT AGREEMENT CONFIRMATION MODAL ────────────────────── */}
      {showAcceptModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => setShowAcceptModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "2.25rem",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.75rem" }}>📜</span>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                Accept Digital Publishing Agreement
              </h2>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              You are about to accept <strong>{data?.agreementStatus?.activeAgreement?.version || "VSB-DPA-1.0"}</strong>. Your acceptance will be recorded with your account and associated with your publishing activity.
            </p>

            <div
              style={{
                backgroundColor: "#fffcf9",
                border: "1.5px solid #fae8c8",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                marginBottom: "1.75rem",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  cursor: "pointer",
                  fontSize: "0.92rem",
                  color: "#1e293b",
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={modalAgreementChecked}
                  onChange={(e) => setModalAgreementChecked(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: "2px", accentColor: "var(--accent-dark)", cursor: "pointer" }}
                />
                <span>
                  I have read and understood the Veeer Sukhadiya Books Digital Publishing Agreement and agree to its terms.
                </span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="btn btn-outline"
                style={{ padding: "0.65rem 1.25rem", fontWeight: 600 }}
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={handleAcceptAgreement}
                disabled={!modalAgreementChecked || acceptingAgreement}
                className="btn btn-primary"
                style={{ padding: "0.65rem 1.5rem", fontWeight: 700 }}
              >
                {acceptingAgreement ? "Recording..." : "Accept Agreement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
