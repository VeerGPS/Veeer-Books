"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ADMIN_PASSWORD } from "@/lib/admin";

export default function AdminSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const [submission, setSubmission] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Modals / forms
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Formatting upload files
  const [readerFile, setReaderFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingFormat, setUploadingFormat] = useState(false);

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
      setError("");
      void loadDetails();
    } else {
      setError("Incorrect admin password.");
    }
  };

  const loadDetails = async () => {
    if (!params?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/publishing/submissions/${params.id}`, {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submission details");
      setSubmission(data.submission);
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      void loadDetails();
    }
  }, [authorized, params?.id]);

  const executeAction = async (actionName: string, extraPayload: Record<string, any> = {}) => {
    if (!confirm(`Are you sure you want to execute action "${actionName}"?`)) return;

    setActionBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/publishing/submissions/${params?.id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          action: actionName,
          ...extraPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      alert(`✅ ${data.message || "Action completed successfully"}`);
      setFeedbackModalOpen(false);
      setRejectModalOpen(false);
      await loadDetails();
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : "Action failed"}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleUploadFormattedFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readerFile && !pdfFile) {
      alert("Please select a reader HTML file or PDF to upload.");
      return;
    }

    setUploadingFormat(true);
    try {
      const body = new FormData();
      if (readerFile) body.append("readerFile", readerFile);
      if (pdfFile) body.append("pdfFile", pdfFile);

      const res = await fetch(`/api/admin/publishing/submissions/${params?.id}/format`, {
        method: "POST",
        headers: { "x-admin-password": ADMIN_PASSWORD },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      alert("✅ Formatted reader files uploaded successfully!");
      setReaderFile(null);
      setPdfFile(null);
      await loadDetails();
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : "Failed to upload format files"}`);
    } finally {
      setUploadingFormat(false);
    }
  };

  if (!authorized) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem 4rem", color: "#0f172a" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Admin Review Access</h1>
          <p style={{ color: "#475569", marginBottom: "1.5rem", textAlign: "center" }}>Enter password to review manuscript and trigger publishing actions.</p>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
          {error && <p style={{ color: "#dc2626", marginBottom: "1rem", fontWeight: 500 }}>{error}</p>}
          <button className="btn btn-primary btn-full" onClick={unlock} style={{ padding: "0.85rem", fontWeight: 600 }}>
            Unlock Review
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem", textAlign: "center" }}>
        <p>Loading submission details...</p>
      </main>
    );
  }

  if (error || !submission) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "#dc2626", fontWeight: 600 }}>{error || "Submission not found"}</p>
        <Link href="/admin/publishing" className="btn btn-outline" style={{ marginTop: "1rem" }}>
          ← Back to Publishing Queue
        </Link>
      </main>
    );
  }

  const author = submission.authorId;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "4rem 1rem 6rem", color: "#0f172a" }}>
      <div className="container" style={{ maxWidth: 1160, margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <Link href="/admin/publishing" style={{ color: "#b45309", fontWeight: 700, fontSize: "0.95rem" }}>
            ← Back to Publishing Queue
          </Link>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Submission Code: <strong>{submission.submissionId}</strong> • Revision #{submission.currentRevision || 1}
          </span>
        </div>

        {/* Main Status & Action Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2rem", marginBottom: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0 }}>{submission.title}</h1>
                <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 800, backgroundColor: "#fef3c7", color: "#b45309" }}>
                  {submission.status}
                </span>
              </div>
              <p style={{ color: "#475569", margin: 0, fontSize: "0.95rem" }}>
                By <strong>{submission.penName}</strong> ({author?.fullName}) • Category: {submission.category} • Desired Price: ₹{submission.desiredPrice}
              </p>
            </div>

            {/* Workflow Action Buttons */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {["SUBMITTED", "RESUBMITTED"].includes(submission.status) && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#0284c7", color: "#ffffff", fontWeight: 700 }}
                  onClick={() => executeAction("START_REVIEW")}
                  disabled={actionBusy}
                >
                  🧐 Start Review
                </button>
              )}

              {["SUBMITTED", "RESUBMITTED", "UNDER_REVIEW"].includes(submission.status) && (
                <>
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#15803d", color: "#ffffff", fontWeight: 700 }}
                    onClick={() => executeAction("APPROVE")}
                    disabled={actionBusy}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#dc2626", color: "#ffffff", fontWeight: 700 }}
                    onClick={() => setFeedbackModalOpen(true)}
                    disabled={actionBusy}
                  >
                    ⚠️ Request Changes
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: "#991b1b", borderColor: "#fca5a5" }}
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionBusy}
                  >
                    ❌ Reject
                  </button>
                </>
              )}

              {submission.status === "APPROVED" && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#6d28d9", color: "#ffffff", fontWeight: 700 }}
                  onClick={() => executeAction("MOVE_TO_FORMATTING")}
                  disabled={actionBusy}
                >
                  🛠️ Move to Formatting Stage
                </button>
              )}

              {submission.status === "FORMATTING" && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#0284c7", color: "#ffffff", fontWeight: 700 }}
                  onClick={() => executeAction("COMPLETE_QUALITY_CHECK")}
                  disabled={actionBusy}
                >
                  🔍 Mark Formatting Quality Verified
                </button>
              )}

              {submission.status === "QUALITY_CHECK" && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#6d28d9", color: "#ffffff", fontWeight: 700 }}
                  onClick={() => executeAction("MARK_READY")}
                  disabled={actionBusy}
                >
                  🚀 Mark Ready to Publish
                </button>
              )}

              {["READY_TO_PUBLISH", "QUALITY_CHECK", "FORMATTING", "APPROVED"].includes(submission.status) && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#15803d", color: "#ffffff", fontWeight: 800, padding: "0.6rem 1.25rem" }}
                  onClick={() => executeAction("PUBLISH")}
                  disabled={actionBusy}
                >
                  ✨ Publish Live to Store
                </button>
              )}

              {submission.status === "PUBLISHED" && submission.publishedBookSlug && (
                <Link
                  href={`/product/${submission.publishedBookSlug}`}
                  target="_blank"
                  className="btn btn-primary btn-sm"
                >
                  View Product on Storefront →
                </Link>
              )}
            </div>
          </div>

          {/* Feedback & Notes Alert */}
          {submission.adminFeedback && (
            <div style={{ marginTop: "1.25rem", padding: "1rem", backgroundColor: "#fef2f2", borderLeft: "4px solid #dc2626", borderRadius: "6px" }}>
              <strong style={{ color: "#991b1b" }}>Current Admin Feedback:</strong>
              <p style={{ color: "#7f1d1d", margin: "0.25rem 0 0 0", fontSize: "0.92rem" }}>{submission.adminFeedback}</p>
            </div>
          )}
        </div>

        {/* ─── Grid: Author Info & Book Info ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          
          {/* Author Details Card */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", color: "#0f172a" }}>👤 Author & Rights Information</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", width: "40%" }}>Pen Name</td>
                  <td style={{ padding: "8px 0", fontWeight: 700 }}>{submission.penName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Legal Full Name</td>
                  <td style={{ padding: "8px 0" }}>{author?.fullName || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Email</td>
                  <td style={{ padding: "8px 0" }}>{author?.email}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Author Type</td>
                  <td style={{ padding: "8px 0" }}>{author?.authorType}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Rights Declared</td>
                  <td style={{ padding: "8px 0", color: "#15803d", fontWeight: 700 }}>
                    ✓ Confirmed ({new Date(submission.rightsConfirmedAt || submission.createdAt).toLocaleDateString()})
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Agreement Version</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "var(--accent-dark)" }}>
                    {submission.agreementVersion || "VSB-DPA-1.0"} (Accepted)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", color: "#64748b" }}>Public Profile</td>
                  <td style={{ padding: "8px 0" }}>
                    {author?.slug ? (
                      <Link href={`/author/${author.slug}`} target="_blank" style={{ color: "#b45309", fontWeight: 700 }}>
                        /author/{author.slug} ↗
                      </Link>
                    ) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Book Files Card */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", color: "#0f172a" }}>📄 Files & Artwork</h3>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
              <div style={{ width: 100, height: 140, position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", flexShrink: 0 }}>
                <Image
                  src={submission.coverFile?.storagePath ? `/api/files/secure/${submission.coverFile.storagePath}` : "/images/default-book.svg"}
                  alt={submission.title}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>

              <div style={{ flex: 1, fontSize: "0.9rem" }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Manuscript:</strong> {submission.manuscriptFile?.originalName || "Uploaded"}
                </div>
                <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
                  Size: {submission.manuscriptFile?.sizeBytes ? (submission.manuscriptFile.sizeBytes / (1024 * 1024)).toFixed(2) + " MB" : "—"}
                </div>

                {submission.manuscriptFile?.storagePath ? (
                  <a
                    href={`/api/files/secure/${submission.manuscriptFile.storagePath}?download=1`}
                    className="btn btn-primary btn-sm"
                    style={{ display: "inline-block", textDecoration: "none" }}
                  >
                    📥 Download Author Manuscript
                  </a>
                ) : (
                  <span style={{ color: "#dc2626" }}>No manuscript file uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Manual Formatting & Reader Files Uploader (For Admin) ───── */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "2px solid #6d28d9", padding: "2rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#6d28d9" }}>
                🛠️ Formatted Reader HTML & PDF Deliverables
              </h3>
              <p style={{ color: "#475569", margin: "0.25rem 0 0 0", fontSize: "0.92rem" }}>
                Upload the manually converted standalone reader HTML and PDF files for this book.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1rem", fontSize: "0.92rem" }}>
            <div><strong>Active Reader Path:</strong> {submission.formattedReaderFile || "Using default reader template"}</div>
            <div><strong>Active PDF Path:</strong> {submission.formattedPdfFile || "Using default PDF template"}</div>
          </div>

          <form onSubmit={handleUploadFormattedFiles} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                Upload Standalone Reader HTML (.html)
              </label>
              <input type="file" accept=".html,text/html" onChange={(e) => setReaderFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                Upload Final Book PDF (.pdf)
              </label>
              <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>

            <button type="submit" className="btn btn-sm" disabled={uploadingFormat} style={{ backgroundColor: "#6d28d9", color: "#ffffff", padding: "0.65rem 1.25rem", fontWeight: 700 }}>
              {uploadingFormat ? "Uploading..." : "Save Reader Files"}
            </button>
          </form>
        </div>

        {/* ─── Audit Trail ─────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Publishing Audit Trail</h3>
          {auditLogs.length === 0 ? (
            <p style={{ color: "#64748b" }}>No audit log entries recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {auditLogs.map((log: any) => (
                <div key={log._id} style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #f1f5f9", backgroundColor: "#fafaf9", fontSize: "0.88rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <strong>{log.action}</strong>
                    <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: "#475569" }}>
                    By <strong>{log.actorName}</strong> ({log.actorRole}) • {log.previousStatus ? `${log.previousStatus} → ${log.newStatus}` : log.newStatus}
                  </div>
                  {log.notes && <div style={{ color: "#0f172a", marginTop: "0.25rem" }}>{log.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Request Changes Modal ───────────────────────────────────── */}
        {feedbackModalOpen && (
          <div className="modal-overlay" onClick={() => setFeedbackModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>Request Changes From Author</h2>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Provide specific guidance on what revisions or formatting adjustments are required.
              </p>
              <textarea
                rows={5}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="e.g. Please format chapter headings clearly and upload a higher resolution cover image..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "inherit", marginBottom: "1rem" }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn btn-sm"
                  style={{ flex: 1, backgroundColor: "#dc2626", color: "#ffffff", padding: "0.75rem", fontWeight: 700 }}
                  onClick={() => executeAction("REQUEST_CHANGES", { feedback: feedbackText })}
                  disabled={actionBusy || !feedbackText.trim()}
                >
                  Send Changes Request to Author
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setFeedbackModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Reject Modal ────────────────────────────────────────────── */}
        {rejectModalOpen && (
          <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>Reject Submission</h2>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Please provide the reason for rejection.
              </p>
              <textarea
                rows={4}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Content violates copyright or publishing guidelines..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "inherit", marginBottom: "1rem" }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn btn-sm"
                  style={{ flex: 1, backgroundColor: "#dc2626", color: "#ffffff", padding: "0.75rem", fontWeight: 700 }}
                  onClick={() => executeAction("REJECT", { feedback: rejectReason })}
                  disabled={actionBusy}
                >
                  Confirm Rejection
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
