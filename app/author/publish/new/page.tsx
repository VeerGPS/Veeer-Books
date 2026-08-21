"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { calculateSubmissionCompleteness } from "@/lib/completeness";
import { trackMarketplaceEvent } from "@/lib/analytics";

export default function NewBookSubmissionWizard() {
  const router = useRouter();
  const { isLoggedIn, token, isReady } = useAuth();
  const { show } = useModal();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [categories, setCategories] = useState<string[]>([
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
  const [languages, setLanguages] = useState<string[]>(["English", "Hindi", "Gujarati"]);

  // Form Fields
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
    rightsConfirmed: false,
    termsAccepted: false,
    accurateInfoConfirmed: false,
    agreementVersion: "VSB-DPA-1.0",
  });

  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    trackMarketplaceEvent("book_submission_started");
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (isLoggedIn && token) {
      setCheckingProfile(true);
      fetch("/api/author/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data?.profile) {
            router.push("/author/setup");
          } else {
            setAuthorProfile(data.profile);
            setFormData((prev) => ({
              ...prev,
              penName: prev.penName || data.profile.penName,
            }));
          }
        })
        .catch(() => router.push("/author/setup"))
        .finally(() => setCheckingProfile(false));

      fetch("/api/author/agreement", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.activeAgreement?.version) {
            setFormData((prev) => ({
              ...prev,
              agreementVersion: data.activeAgreement.version,
            }));
          }
        })
        .catch((err) => console.error("Failed to load active agreement version:", err));
    } else {
      setCheckingProfile(false);
    }
  }, [isLoggedIn, token, isReady, router]);

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      trackMarketplaceEvent("cover_uploaded");
      const url = URL.createObjectURL(file);
      setCoverPreviewUrl(url);
    } else {
      setCoverPreviewUrl(null);
    }
  };

  const handleManuscriptChange = (file: File | null) => {
    setManuscriptFile(file);
    if (file) {
      trackMarketplaceEvent("manuscript_uploaded");
    }
  };

  const completeness = calculateSubmissionCompleteness({
    title: formData.title,
    description: formData.description,
    category: formData.category,
    language: formData.language,
    desiredPrice: Number(formData.desiredPrice || 0),
    manuscriptFile: manuscriptFile ? { storagePath: "pending" } : undefined,
    coverFile: coverFile ? { storagePath: "pending" } : undefined,
    rightsConfirmed: formData.rightsConfirmed,
    termsAccepted: formData.termsAccepted,
  });

  const handleSubmit = async (action: "draft" | "submit") => {
    if (!token) return;
    setSubmitting(true);
    setError("");

    try {
      if (action === "submit") {
        if (!completeness.isComplete) {
          throw new Error(
            `Please complete all required fields before submitting. Missing: ${completeness.missingFields.join(", ")}`
          );
        }
        if (!formData.rightsConfirmed || !formData.termsAccepted || !formData.accurateInfoConfirmed) {
          throw new Error("You must accept all required author declarations and terms before submitting.");
        }
      }

      const body = new FormData();
      body.append("title", formData.title);
      body.append("subtitle", formData.subtitle);
      body.append("penName", formData.penName || authorProfile?.penName || "");
      body.append("description", formData.description);
      body.append("category", formData.category);
      body.append("subcategory", formData.subcategory);
      body.append("language", formData.language);
      body.append("intendedAudience", formData.intendedAudience);
      body.append("publicationDetails", formData.publicationDetails);
      body.append("tags", formData.tags);
      body.append("desiredPrice", formData.desiredPrice);
      body.append("actualPrice", formData.actualPrice || formData.desiredPrice);
      body.append("rightsConfirmed", String(formData.rightsConfirmed));
      body.append("termsAccepted", String(formData.termsAccepted));
      body.append("accurateInfoConfirmed", String(formData.accurateInfoConfirmed));
      body.append("agreementVersion", formData.agreementVersion);
      body.append("action", action);

      if (manuscriptFile) body.append("manuscriptFile", manuscriptFile);
      if (coverFile) body.append("coverFile", coverFile);

      const res = await fetch("/api/author/submissions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit book");

      if (action === "submit") {
        trackMarketplaceEvent("submission_submitted");
        alert("🎉 Congratulations! Your book has been submitted for editorial review.");
      } else {
        alert("Draft saved successfully.");
      }

      router.push(`/author/submissions/${json.submission._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process submission");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    "Book Information",
    "Upload Files",
    "Pricing & Royalty",
    "Rights & Declarations",
    "Review & Checklist",
    "Submit for Publication",
  ];

  if (!isReady || checkingProfile) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading Book Submission Wizard...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "6rem 1rem 4rem" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", marginBottom: "1rem" }}>Publish a New Book</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Please sign in to access the book submission wizard.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => show("login")}>Sign In</button>
            <button className="btn btn-outline" onClick={() => show("signup")}>Sign Up</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "4rem 1rem 6rem" }}>
      <div className="container" style={{ maxWidth: 880, margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <Link href="/author/dashboard" style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem" }}>
            ← Back to Author Dashboard
          </Link>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Completeness: <strong style={{ color: completeness.isComplete ? "#15803d" : "#b45309" }}>{completeness.percentage}%</strong>
          </span>
        </div>

        {/* Wizard Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            padding: "2.5rem",
            boxShadow: "0 4px 25px rgba(0,0,0,0.04)",
          }}
        >
          {/* Progress Header */}
          <div style={{ marginBottom: "2rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-dark)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                STEP {step} OF 6: {stepTitles[step - 1]}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {completeness.percentage}% Complete
              </span>
            </div>

            {/* Visual Step Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  style={{
                    backgroundColor: s <= step ? "var(--accent)" : "transparent",
                    transition: "var(--transition)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ─── STEP 1: BOOK INFORMATION ───────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", marginBottom: "0.4rem" }}>
                Step 1: Book Information & Metadata
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
                Enter the primary literary details for your digital book publication.
              </p>

              <div className="form-group">
                <label>Book Title *</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Silent Horizon"
                />
              </div>

              <div className="form-group">
                <label>Subtitle (Optional)</label>
                <input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. A Journey of Truth and Discovery"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Author / Pen Name *</label>
                  <input
                    required
                    value={formData.penName}
                    onChange={(e) => setFormData({ ...formData, penName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Primary Genre / Category *</label>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Subcategory (Optional)</label>
                  <input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Psychological Thriller"
                  />
                </div>
                <div className="form-group">
                  <label>Language *</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }}
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Book Description / Synopsis *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a compelling synopsis of your book for readers..."
                  style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Intended Audience (Optional)</label>
                  <input
                    value={formData.intendedAudience}
                    onChange={(e) => setFormData({ ...formData, intendedAudience: e.target.value })}
                    placeholder="e.g. Young Adults, Mystery Lovers, Students"
                  />
                </div>
                <div className="form-group">
                  <label>Keywords / Tags (Comma separated)</label>
                  <input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. thriller, suspense, novel, investigation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: UPLOAD FILES ───────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", marginBottom: "0.4rem" }}>
                Step 2: Upload Manuscript & Cover Art
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
                Upload your completed manuscript and high-resolution cover image.
              </p>

              {/* Manuscript File Box */}
              <div style={{ backgroundColor: "#fafaf9", border: "2px dashed var(--border)", padding: "1.75rem", borderRadius: "12px", marginBottom: "1.75rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>📄 Manuscript Document *</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Accepted formats: <strong>PDF (.pdf), Word (.docx, .doc), EPUB (.epub), Plain Text (.txt, .rtf)</strong>. Max file size: 50MB.
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.epub,.txt,.rtf"
                  onChange={(e) => handleManuscriptChange(e.target.files?.[0] || null)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }}
                />
                {manuscriptFile && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: "#15803d", fontWeight: 600 }}>
                    ✓ Selected: {manuscriptFile.name} ({(manuscriptFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              {/* Cover File Box */}
              <div style={{ backgroundColor: "#fafaf9", border: "2px dashed var(--border)", padding: "1.75rem", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>🎨 Book Cover Artwork *</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Accepted formats: <strong>JPG, PNG, WEBP</strong>. Recommended ratio: 2:3 (e.g. 1200 x 1800 px).
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }}
                />

                {coverPreviewUrl && (
                  <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.25rem", alignItems: "center" }}>
                    <div style={{ width: 100, height: 140, position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                      <Image src={coverPreviewUrl} alt="Cover Preview" fill style={{ objectFit: "cover" }} unoptimized />
                    </div>
                    <span style={{ fontSize: "0.88rem", color: "#15803d", fontWeight: 600 }}>
                      ✓ Cover image preview ready
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 3: PRICING ────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", marginBottom: "0.4rem" }}>
                Step 3: Pricing & Commercials
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
                Set your desired selling price in Indian Rupees (INR).
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label>Your Selling Price (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.desiredPrice}
                    onChange={(e) => setFormData({ ...formData, desiredPrice: e.target.value })}
                    placeholder="149"
                  />
                  <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.4rem" }}>
                    The actual price charged to readers at checkout.
                  </small>
                </div>

                <div className="form-group">
                  <label>Original MRP / Strike Price (INR)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.actualPrice}
                    onChange={(e) => setFormData({ ...formData, actualPrice: e.target.value })}
                    placeholder="199"
                  />
                  <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.4rem" }}>
                    Optional strike-through price shown to indicate discounts.
                  </small>
                </div>
              </div>

              <div style={{ backgroundColor: "#faf8f5", padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid var(--accent)" }}>
                <span style={{ fontWeight: 800, color: "var(--accent-dark)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  💡 Transparent Revenue Attribution
                </span>
                <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.92rem", color: "#334155", lineHeight: 1.6 }}>
                  You earn your agreed author share on every single verified copy sold. Sales are recorded instantly to your author revenue ledger.
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 4: RIGHTS & DECLARATIONS ──────────────────────────── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", marginBottom: "0.4rem" }}>
                Step 4: Author Declaration & Publishing Agreement
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
                Please review and confirm all three required legal and publishing declarations below.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Checkbox 1 */}
                <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: formData.rightsConfirmed ? "#faf8f5" : "#ffffff" }}>
                  <input
                    type="checkbox"
                    checked={formData.rightsConfirmed}
                    onChange={(e) => setFormData({ ...formData, rightsConfirmed: e.target.checked })}
                    style={{ width: 20, height: 20, marginTop: 2 }}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.98rem", color: "var(--text-main)" }}>
                      1. Copyright & Ownership Declaration *
                    </strong>
                    <span style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      I confirm that I own or have obtained the necessary rights and permissions to publish and digitally distribute this work.
                    </span>
                  </div>
                </label>

                {/* Checkbox 2 */}
                <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: formData.termsAccepted ? "#faf8f5" : "#ffffff" }}>
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    style={{ width: 20, height: 20, marginTop: 2 }}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.98rem", color: "var(--text-main)" }}>
                      2. Publishing Agreement & Terms (Version {formData.agreementVersion}) *
                    </strong>
                    <span style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      I have read and agree to the Veeer Sukhadiya Books <Link href="/publishing-agreement" target="_blank" style={{ color: "var(--accent-dark)", fontWeight: 700, textDecoration: "underline" }}>Digital Publishing Agreement</Link>, Content Guidelines, and Author Terms.
                    </span>
                  </div>
                </label>

                {/* Checkbox 3 */}
                <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: formData.accurateInfoConfirmed ? "#faf8f5" : "#ffffff" }}>
                  <input
                    type="checkbox"
                    checked={formData.accurateInfoConfirmed}
                    onChange={(e) => setFormData({ ...formData, accurateInfoConfirmed: e.target.checked })}
                    style={{ width: 20, height: 20, marginTop: 2 }}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.98rem", color: "var(--text-main)" }}>
                      3. Accuracy Confirmation *
                    </strong>
                    <span style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      I confirm that all information provided in this submission is accurate and complete.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ─── STEP 5: REVIEW & CHECKLIST ─────────────────────────────── */}
          {step === 5 && (
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", marginBottom: "0.4rem" }}>
                Step 5: Review Submission & Completeness Checklist
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
                Verify all submission details before submitting for editorial review.
              </p>

              {/* Completeness Checklist Card */}
              <div style={{ backgroundColor: completeness.isComplete ? "#f0fdf4" : "#fffbeb", border: `1px solid ${completeness.isComplete ? "#86efac" : "#fde047"}`, padding: "1.5rem", borderRadius: "14px", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", color: completeness.isComplete ? "#15803d" : "#b45309", fontWeight: 700 }}>
                    {completeness.isComplete ? "✓ Submission 100% Complete" : `Submission ${completeness.percentage}% Complete`}
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {completeness.checklist.map((c, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                      <span style={{ color: c.done ? "#15803d" : "#dc2626", fontWeight: 800 }}>
                        {c.done ? "✓" : "✗"}
                      </span>
                      <span style={{ color: c.done ? "#1e293b" : "#64748b" }}>{c.item}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ color: formData.accurateInfoConfirmed ? "#15803d" : "#dc2626", fontWeight: 800 }}>
                      {formData.accurateInfoConfirmed ? "✓" : "✗"}
                    </span>
                    <span style={{ color: formData.accurateInfoConfirmed ? "#1e293b" : "#64748b" }}>Accurate Info Confirmed</span>
                  </div>
                </div>
              </div>

              {/* Details Summary Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem", backgroundColor: "#fafaf9", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b", width: "35%" }}>Title</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700 }}>{formData.title || "—"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b" }}>Author Pen Name</td>
                    <td style={{ padding: "10px 14px" }}>{formData.penName || authorProfile?.penName}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b" }}>Category & Language</td>
                    <td style={{ padding: "10px 14px" }}>{formData.category} • {formData.language}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b" }}>Selling Price</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--accent-dark)" }}>₹{formData.desiredPrice}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b" }}>Manuscript File</td>
                    <td style={{ padding: "10px 14px" }}>{manuscriptFile?.name || "Not uploaded"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b" }}>Cover Artwork</td>
                    <td style={{ padding: "10px 14px" }}>{coverFile?.name || "Not uploaded"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#64748b" }}>Agreement Version</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#15803d" }}>{formData.agreementVersion} (Accepted)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ─── STEP 6: SUBMIT ─────────────────────────────────────────── */}
          {step === 6 && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.75rem" }}>🚀</span>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", marginBottom: "0.5rem" }}>
                Ready for Publication Review
              </h2>
              <p style={{ color: "var(--text-muted)", maxWidth: 540, margin: "0 auto 1.5rem", lineHeight: 1.65 }}>
                When you click <strong>Submit for Publication</strong>, your manuscript and declarations (Agreement Version: <strong>{formData.agreementVersion}</strong>) will be recorded and submitted to the Veeer Sukhadiya Books editorial team.
              </p>

              {/* Status checklist check */}
              {!(formData.rightsConfirmed && formData.termsAccepted && formData.accurateInfoConfirmed) ? (
                <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde047", color: "#92400e", padding: "1rem 1.25rem", borderRadius: "10px", maxWidth: 540, margin: "0 auto 1.5rem", textAlign: "left", fontSize: "0.9rem" }}>
                  <strong>⚠️ Action Required:</strong> Please go back to Step 4 and confirm all three Author Declarations & Publishing Agreement checkboxes before submitting.
                </div>
              ) : null}

              {completeness.isComplete && formData.rightsConfirmed && formData.termsAccepted && formData.accurateInfoConfirmed ? (
                <button
                  onClick={() => handleSubmit("submit")}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: "1rem 3rem", fontSize: "1.15rem", fontWeight: 800 }}
                >
                  {submitting ? "Submitting for Publication..." : "🚀 Submit for Publication"}
                </button>
              ) : (
                <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "10px", maxWidth: 500, margin: "0 auto" }}>
                  Please complete all required items (100%) and accept all declarations before submitting.
                </div>
              )}
            </div>
          )}

          {error && <p style={{ color: "#dc2626", margin: "1.5rem 0 0 0", fontWeight: 600 }}>{error}</p>}

          {/* Wizard Controls Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={submitting}
                >
                  ← Previous Step
                </button>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleSubmit("draft")}
                disabled={submitting || !formData.title}
              >
                💾 Save as Draft
              </button>

              {step < 6 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setStep((s) => Math.min(6, s + 1))}
                >
                  Next Step →
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
