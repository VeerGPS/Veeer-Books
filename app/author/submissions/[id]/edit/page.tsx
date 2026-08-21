"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trackMarketplaceEvent } from "@/lib/analytics";

export default function EditAndResubmitPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<any>(null);

  const [categories] = useState<string[]>([
    "Mystery & Thriller",
    "Self-Help & Productivity",
    "Technology & AI",
    "Fiction & Literature",
    "Children's Literature",
    "Business & Entrepreneurship",
    "Poetry & Plays",
    "Education & Academics",
    "General",
  ]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    penName: "",
    description: "",
    category: "General",
    subcategory: "",
    language: "English",
    intendedAudience: "",
    tags: "",
    publicationDetails: "",
    desiredPrice: "149",
    actualPrice: "199",
    authorNotes: "",
  });

  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const loadSubmission = async () => {
    if (!token || !params?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/author/submissions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submission");

      const s = data.submission;
      setSubmission(s);
      setFormData({
        title: s.title || "",
        subtitle: s.subtitle || "",
        penName: s.penName || "",
        description: s.description || "",
        category: s.category || "General",
        subcategory: s.subcategory || "",
        language: s.language || "English",
        intendedAudience: s.intendedAudience || "",
        tags: Array.isArray(s.tags) ? s.tags.join(", ") : "",
        publicationDetails: s.publicationDetails || "",
        desiredPrice: String(s.desiredPrice || 149),
        actualPrice: String(s.actualPrice || 199),
        authorNotes: "",
      });
      if (s.coverFile?.storagePath) {
        setCoverPreviewUrl(`/api/files/secure/${s.coverFile.storagePath}`);
      }
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

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !params?.id) return;
    setSubmitting(true);
    setError("");

    try {
      const body = new FormData();
      body.append("title", formData.title);
      body.append("subtitle", formData.subtitle);
      body.append("penName", formData.penName);
      body.append("description", formData.description);
      body.append("category", formData.category);
      body.append("subcategory", formData.subcategory);
      body.append("language", formData.language);
      body.append("intendedAudience", formData.intendedAudience);
      body.append("publicationDetails", formData.publicationDetails);
      body.append("tags", formData.tags);
      body.append("desiredPrice", formData.desiredPrice);
      body.append("actualPrice", formData.actualPrice);
      body.append("authorNotes", formData.authorNotes);
      body.append("action", "resubmit");

      if (manuscriptFile) body.append("manuscriptFile", manuscriptFile);
      if (coverFile) body.append("coverFile", coverFile);

      const res = await fetch(`/api/author/submissions/${params.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resubmit revision");

      trackMarketplaceEvent("submission_resubmitted");
      alert("✅ Revision resubmitted for editorial review successfully!");
      router.push(`/author/submissions/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resubmit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p>Please sign in to edit your submission.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading submission editor...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "4rem 1rem 6rem" }}>
      <div className="container" style={{ maxWidth: 880, margin: "0 auto" }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href={`/author/submissions/${params?.id}`} style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem" }}>
            ← Back to Submission Details
          </Link>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", border: "1px solid var(--border)", padding: "2.5rem", boxShadow: "0 4px 25px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ color: "var(--accent-dark)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "1px" }}>
              SUBMISSION REVISION #{((submission?.currentRevision || 1) + 1)}
            </span>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.9rem", margin: "0.25rem 0 0.5rem 0" }}>
              Edit & Resubmit: {submission?.title}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Make required adjustments and submit a new revision for editorial review.
            </p>
          </div>

          {/* Editorial Feedback Box */}
          {submission?.adminFeedback && (
            <div style={{ backgroundColor: "#fef2f2", borderLeft: "4px solid #dc2626", padding: "1.25rem", borderRadius: "8px", marginBottom: "2rem" }}>
              <strong style={{ color: "#991b1b", display: "block", marginBottom: "0.3rem" }}>
                Admin Feedback / Requested Changes:
              </strong>
              <p style={{ color: "#7f1d1d", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
                {submission.adminFeedback}
              </p>
            </div>
          )}

          <form onSubmit={handleResubmit}>
            <div className="form-group">
              <label>Book Title *</label>
              <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Subtitle (Optional)</label>
              <input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Pen Name *</label>
                <input required value={formData.penName} onChange={(e) => setFormData({ ...formData, penName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description / Synopsis *</label>
              <textarea rows={5} required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label>Selling Price (INR) *</label>
                <input type="number" min="1" required value={formData.desiredPrice} onChange={(e) => setFormData({ ...formData, desiredPrice: e.target.value })} />
              </div>
              <div className="form-group">
                <label>MRP / Strike Price (INR)</label>
                <input type="number" min="1" value={formData.actualPrice} onChange={(e) => setFormData({ ...formData, actualPrice: e.target.value })} />
              </div>
            </div>

            {/* Replace Manuscript */}
            <div style={{ backgroundColor: "#fafaf9", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "1.25rem" }}>
              <label style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
                📄 Replace Manuscript Document (Optional)
              </label>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Current: {submission?.manuscriptFile?.originalName || "Uploaded"}. Select a new file only if updating manuscript content.
              </p>
              <input type="file" accept=".pdf,.docx,.doc,.epub,.txt,.rtf" onChange={(e) => setManuscriptFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }} />
            </div>

            {/* Replace Cover */}
            <div style={{ backgroundColor: "#fafaf9", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
              <label style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
                🎨 Replace Cover Artwork (Optional)
              </label>
              <input type="file" accept="image/*" onChange={(e) => handleCoverChange(e.target.files?.[0] || null)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }} />
              {coverPreviewUrl && (
                <div style={{ marginTop: "1rem", width: 80, height: 110, position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <Image src={coverPreviewUrl} alt="Cover Preview" fill style={{ objectFit: "cover" }} unoptimized />
                </div>
              )}
            </div>

            {/* Author Notes on Changes */}
            <div className="form-group" style={{ marginBottom: "1.75rem" }}>
              <label>Author Notes on Changes Made</label>
              <textarea
                rows={3}
                value={formData.authorNotes}
                onChange={(e) => setFormData({ ...formData, authorNotes: e.target.value })}
                placeholder="Explain what changes were made in this revision for the editorial team..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit" }}
              />
            </div>

            {error && <p style={{ color: "#dc2626", marginBottom: "1.25rem", fontWeight: 600 }}>{error}</p>}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: "0.9rem 2.5rem", fontSize: "1.05rem", fontWeight: 800 }}>
                {submitting ? "Resubmitting Revision..." : "🔄 Resubmit Revision for Review"}
              </button>
              <Link href={`/author/submissions/${params?.id}`} className="btn btn-outline">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
