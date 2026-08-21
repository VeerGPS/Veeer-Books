"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";

export default function AuthorSetupPage() {
  const router = useRouter();
  const { isLoggedIn, token, isReady, refreshAuthorStatus } = useAuth();
  const { show } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    penName: "",
    authorType: "Individual Author",
    country: "India",
    biography: "",
    website: "",
    phone: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  });

  useEffect(() => {
    if (!isReady) return;

    if (isLoggedIn && token) {
      fetch("/api/author/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated === false) {
            localStorage.removeItem("auth_token");
            refreshAuthorStatus();
            return;
          }
          if (data?.profile) {
            setHasExistingProfile(true);
            setForm({
              fullName: data.profile.fullName || "",
              penName: data.profile.penName || "",
              authorType: data.profile.authorType || "Individual Author",
              country: data.profile.country || "India",
              biography: data.profile.biography || "",
              website: data.profile.website || "",
              phone: data.profile.phone || "",
              twitter: data.profile.socialLinks?.twitter || "",
              instagram: data.profile.socialLinks?.instagram || "",
              linkedin: data.profile.socialLinks?.linkedin || "",
            });
          }
        })
        .catch((err) => console.error("Profile load error:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token, isReady, refreshAuthorStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!form.penName || !form.penName.trim()) {
        throw new Error("Pen Name / Author Name is required.");
      }

      const res = await fetch("/api/author/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          penName: form.penName,
          country: form.country,
          phone: form.phone,
          website: form.website,
          biography: form.biography,
          authorType: form.authorType,
          socialLinks: {
            twitter: form.twitter,
            instagram: form.instagram,
            linkedin: form.linkedin,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save author profile");

      await refreshAuthorStatus();
      setMessage("✅ Author profile saved successfully! Redirecting to Author Hub...");
      setTimeout(() => {
        router.push("/author/dashboard");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save author profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isReady || loading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading Author Account Setup...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "6rem 1rem 4rem" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", textAlign: "center" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>✍️</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.85rem", marginBottom: "0.75rem", color: "var(--text-main)" }}>
            Author Account Setup
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Please sign in or create an account to set up your author profile and publish books with Veeer Sukhadiya Books.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => show("login")} style={{ padding: "0.75rem 1.75rem" }}>
              Sign In
            </button>
            <button className="btn btn-outline" onClick={() => show("signup")} style={{ padding: "0.75rem 1.75rem" }}>
              Create Account
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "4rem 1rem 6rem" }}>
      <div className="container" style={{ maxWidth: 800, margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/publish" style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem" }}>
            ← Back to Publishing Overview
          </Link>
          {hasExistingProfile && (
            <Link href="/author/dashboard" style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem" }}>
              Author Dashboard →
            </Link>
          )}
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "3rem 2.5rem", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 4px 25px rgba(0,0,0,0.03)" }}>
          <span style={{ color: "var(--accent-dark)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "1.5px", display: "block", marginBottom: "0.25rem" }}>
            {hasExistingProfile ? "AUTHOR PROFILE SETTINGS" : "STEP 1 OF PUBLISHING"}
          </span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "2.2rem", margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>
            {hasExistingProfile ? "Edit Author Profile" : "Create Your Author Profile"}
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2.25rem", lineHeight: 1.6, fontSize: "0.98rem" }}>
            Set up your public author profile, pen name, and biography to start publishing books.
          </p>

          <form onSubmit={handleSubmit}>
            {/* ─── Section 1: Basic Information ─── */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--text-main)" }}>
              1. Public Author Identity
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label>Legal Full Name *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Veer Sukhadiya"
                />
              </div>
              <div className="form-group">
                <label>Pen Name / Author Name *</label>
                <input
                  required
                  value={form.penName}
                  onChange={(e) => setForm({ ...form, penName: e.target.value })}
                  placeholder="e.g. Veer Sukhadiya"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label>Author Type</label>
                <select
                  value={form.authorType}
                  onChange={(e) => setForm({ ...form, authorType: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "white" }}
                >
                  <option value="Individual Author">Individual Author</option>
                  <option value="Publisher">Publisher / Publishing House</option>
                </select>
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="India"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label>Author Biography (Public)</label>
              <textarea
                rows={4}
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Tell readers about yourself, your books, genres, and background..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
              <div className="form-group">
                <label>Official Website (Optional)</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div className="form-group">
                <label>Contact Phone (Private)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            {/* ─── Section 2: Social Links ─── */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--text-main)" }}>
              2. Social Profiles (Optional)
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
              <div className="form-group">
                <label>Twitter / X</label>
                <input
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: "0.85rem 1.25rem", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", marginBottom: "1.25rem", fontWeight: 600 }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{ padding: "0.85rem 1.25rem", borderRadius: "8px", backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", marginBottom: "1.25rem", fontWeight: 600 }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={saving}
              style={{ padding: "1rem", fontSize: "1.1rem", fontWeight: 700 }}
            >
              {saving ? "Saving Author Profile..." : hasExistingProfile ? "Save Profile Changes →" : "Create Author Profile & Continue →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
