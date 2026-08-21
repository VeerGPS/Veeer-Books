"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthorSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [completeness, setCompleteness] = useState<any>(null);
  const [error, setError] = useState("");

  const loadSubmission = async () => {
    if (!token || !params?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/author/submissions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission not found");
      setSubmission(data.submission);
      setCompleteness(data.completeness);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      loadSubmission();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token, params?.id]);

  if (!isLoggedIn) {
    return (
      <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p>Please sign in to view submission details.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading submission details...</p>
      </main>
    );
  }

  if (error || !submission) {
    return (
      <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "#dc2626", fontWeight: 600 }}>{error || "Submission not found"}</p>
        <Link href="/author/dashboard" className="btn btn-outline" style={{ marginTop: "1rem" }}>
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Published</span>;
      case "UNDER_REVIEW":
        return <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Under Review</span>;
      case "CHANGES_REQUESTED":
        return <span style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Changes Requested</span>;
      case "APPROVED":
        return <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Approved</span>;
      case "FORMATTING":
        return <span style={{ backgroundColor: "#ede9fe", color: "#6d28d9", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>In Formatting</span>;
      case "QUALITY_CHECK":
        return <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Quality Check</span>;
      case "READY_TO_PUBLISH":
        return <span style={{ backgroundColor: "#ede9fe", color: "#6d28d9", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Ready to Publish</span>;
      case "RESUBMITTED":
        return <span style={{ backgroundColor: "#e0e7ff", color: "#4338ca", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Resubmitted</span>;
      case "SUBMITTED":
        return <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Submitted</span>;
      default:
        return <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "5px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>Draft</span>;
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "4rem 1rem 6rem" }}>
      <div className="container" style={{ maxWidth: 960, margin: "0 auto" }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/author/dashboard" style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem" }}>
            ← Back to Author Dashboard
          </Link>
        </div>

        {/* Header Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", padding: "2rem", marginBottom: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.85rem", margin: 0 }}>{submission.title}</h1>
                {getStatusBadge(submission.status)}
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
                Submission Code: <strong>{submission.submissionId}</strong> • Current Revision: <strong>#{submission.currentRevision || 1}</strong> • Submitted: {new Date(submission.createdAt).toLocaleDateString()}
              </p>
            </div>

            {submission.status === "CHANGES_REQUESTED" && (
              <Link href={`/author/submissions/${submission._id}/edit`} className="btn btn-sm" style={{ backgroundColor: "#dc2626", color: "#ffffff", fontWeight: 700 }}>
                ✏️ Edit & Resubmit
              </Link>
            )}

            {submission.status === "PUBLISHED" && submission.publishedBookSlug && (
              <Link href={`/product/${submission.publishedBookSlug}`} target="_blank" className="btn btn-primary btn-sm">
                View Live Book on Store →
              </Link>
            )}
          </div>

          {/* Admin Changes Requested Message Box */}
          {submission.status === "CHANGES_REQUESTED" && submission.adminFeedback && (
            <div style={{ marginTop: "1.5rem", backgroundColor: "#fef2f2", borderLeft: "4px solid #dc2626", padding: "1.25rem", borderRadius: "8px" }}>
              <strong style={{ color: "#991b1b", display: "block", marginBottom: "0.4rem", fontSize: "1rem" }}>
                Editorial Team Message / Requested Changes:
              </strong>
              <p style={{ color: "#7f1d1d", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
                {submission.adminFeedback}
              </p>
              <div style={{ marginTop: "1rem" }}>
                <Link href={`/author/submissions/${submission._id}/edit`} className="btn btn-sm" style={{ backgroundColor: "#dc2626", color: "#ffffff", fontWeight: 700 }}>
                  Edit Submission & Resubmit Now →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", marginBottom: "2rem" }}>
          {/* Cover & Manuscript Info */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Artwork & Files</h3>
            <div style={{ width: "100%", height: 260, position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", backgroundColor: "var(--bg-paper-dark)", marginBottom: "1.25rem" }}>
              <Image
                src={submission.coverFile?.storagePath ? `/api/files/secure/${submission.coverFile.storagePath}` : "/images/default-book.svg"}
                alt={submission.title}
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>

            <div style={{ fontSize: "0.9rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Manuscript:</strong> {submission.manuscriptFile?.originalName || "Uploaded"}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.82rem" }}>
                Size: {submission.manuscriptFile?.sizeBytes ? (submission.manuscriptFile.sizeBytes / (1024 * 1024)).toFixed(2) + " MB" : "—"}
              </div>
              {submission.manuscriptFile?.storagePath && (
                <a
                  href={`/api/files/secure/${submission.manuscriptFile.storagePath}?download=1`}
                  className="btn btn-outline btn-sm btn-full"
                  style={{ marginTop: "0.75rem" }}
                >
                  📥 Download Uploaded Manuscript
                </a>
              )}
            </div>
          </div>

          {/* Metadata Table */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Book Metadata</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", width: "35%" }}>Pen Name</td>
                  <td style={{ padding: "8px 0", fontWeight: 600 }}>{submission.penName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Category</td>
                  <td style={{ padding: "8px 0" }}>{submission.category} {submission.subcategory ? `(${submission.subcategory})` : ""}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Language</td>
                  <td style={{ padding: "8px 0" }}>{submission.language}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Selling Price</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "var(--accent-dark)" }}>₹{submission.desiredPrice}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Intended Audience</td>
                  <td style={{ padding: "8px 0" }}>{submission.intendedAudience || "General Readers"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Rights Declared</td>
                  <td style={{ padding: "8px 0", color: "#15803d", fontWeight: 600 }}>✓ Confirmed & Accepted</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Agreement Version</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "var(--accent-dark)" }}>{submission.agreementVersion || "VSB-DPA-1.0"}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "1.25rem", marginBottom: "0.4rem" }}>Synopsis / Description</h4>
            <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {submission.description}
            </p>
          </div>
        </div>

        {/* Revision History List */}
        {submission.revisions && submission.revisions.length > 0 && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Revision History</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {submission.revisions.map((rev: any, idx: number) => (
                <div key={rev._id || idx} style={{ padding: "0.85rem 1.25rem", borderRadius: "8px", border: "1px solid #f1f5f9", backgroundColor: "#fafaf9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <strong>Revision #{rev.revisionNumber || idx + 1}</strong>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(rev.submittedAt || Date.now()).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Title: {rev.title} • Price: ₹{rev.desiredPrice}
                  </div>
                  {rev.authorNotes && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#334155" }}>
                      <strong>Author Notes:</strong> {rev.authorNotes}
                    </div>
                  )}
                  {rev.adminFeedbackAtTime && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#991b1b" }}>
                      <strong>Feedback at time:</strong> {rev.adminFeedbackAtTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
