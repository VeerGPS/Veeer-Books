"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { trackMarketplaceEvent } from "@/lib/analytics";

export default function PublishLandingPage() {
  const router = useRouter();
  const { isLoggedIn, token, isReady } = useAuth();
  const { show } = useModal();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    trackMarketplaceEvent("publish_page_view");
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (isLoggedIn && token) {
      setLoadingProfile(true);
      fetch("/api/author/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated === false) {
            localStorage.removeItem("auth_token");
            setHasProfile(false);
            return;
          }
          setHasProfile(Boolean(data?.profile));
        })
        .catch(() => setHasProfile(false))
        .finally(() => setLoadingProfile(false));
    } else {
      setHasProfile(null);
    }
  }, [isLoggedIn, token, isReady]);

  const handleStartPublishing = () => {
    trackMarketplaceEvent("author_registration_started");
    if (!isLoggedIn) {
      show("signup");
      return;
    }
    if (hasProfile) {
      router.push("/author/dashboard");
    } else {
      router.push("/author/setup");
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)" }}>
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 1rem 4.5rem",
          textAlign: "center",
          background: "radial-gradient(circle at center, #fffcf9 0%, var(--bg-paper-dark) 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ maxWidth: 880 }}>
          <span className="hero-badge">Managed Digital Publishing</span>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              lineHeight: 1.15,
              fontWeight: 800,
              color: "var(--text-main)",
              marginBottom: "1.25rem",
            }}
          >
            Publish Your Book With Veeer Sukhadiya Books
          </h1>
          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "var(--text-muted)",
              maxWidth: 720,
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
            }}
          >
            Turn your manuscript into a polished digital reading experience and reach readers through our publishing platform.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleStartPublishing}
              className="btn btn-primary"
              style={{ padding: "1rem 2.25rem", fontSize: "1.05rem", fontWeight: 700 }}
            >
              {loadingProfile
                ? "Loading..."
                : isLoggedIn
                ? hasProfile
                  ? "Go to Author Dashboard →"
                  : "Set Up Author Profile →"
                : "Start Publishing"}
            </button>
            <Link
              href="#publishing-process"
              className="btn btn-outline"
              style={{ padding: "1rem 2rem", fontSize: "1.05rem" }}
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 6-Step Visual Process Section ─────────────────────────────── */}
      <section id="publishing-process" className="container" style={{ padding: "5rem 1rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span
            style={{
              color: "var(--accent)",
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "0.85rem",
              letterSpacing: "1.5px",
            }}
          >
            THE MANAGED PUBLISHING WORKFLOW
          </span>
          <h2 className="section-title" style={{ padding: 0, marginTop: "0.5rem" }}>
            From Manuscript to Published eBook in 6 Steps
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 620, margin: "0.75rem auto 0", fontSize: "1.05rem" }}>
            We handle the digital craftsmanship and web reader formatting so you can focus on storytelling.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#faf5ea",
                color: "var(--accent-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "1rem",
                border: "1.5px solid var(--accent)",
              }}
            >
              1
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>
              Create Your Author Profile
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "0.75rem" }}>
              Register using your account, choose your pen name, write your author biography, and link your website or social profiles.
            </p>
            <Link
              href={isLoggedIn ? (hasProfile ? "/author/dashboard" : "/author/setup") : "#"}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  show("signup");
                }
              }}
              style={{ display: "inline-block", fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-dark)", textDecoration: "none" }}
            >
              Set Up Author Profile →
            </Link>
          </div>

          {/* Step 2 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#faf5ea",
                color: "var(--accent-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "1rem",
                border: "1.5px solid var(--accent)",
              }}
            >
              2
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>
              Submit Your Book
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Use our structured submission wizard to enter book metadata, select genre categories, upload your manuscript, and set your selling price.
            </p>
          </div>

          {/* Step 3 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#faf5ea",
                color: "var(--accent-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "1rem",
                border: "1.5px solid var(--accent)",
              }}
            >
              3
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>
              We Review Your Manuscript
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Our editorial team inspects your manuscript for rights verification, formatting standards, and publishing guideline compliance.
            </p>
          </div>

          {/* Step 4 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#faf5ea",
                color: "var(--accent-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "1rem",
                border: "1.5px solid var(--accent)",
              }}
            >
              4
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>
              We Format & Prepare Your Book
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65 }}>
              We convert your manuscript into the proprietary Veeer Sukhadiya Books interactive web reader format with night, sepia, and responsive controls.
            </p>
          </div>

          {/* Step 5 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#faf5ea",
                color: "var(--accent-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "1rem",
                border: "1.5px solid var(--accent)",
              }}
            >
              5
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>
              Your Book Goes Live
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Your book receives a dedicated product page, free preview reader, and appears in the official Veeer Sukhadiya Books catalogue.
            </p>
          </div>

          {/* Step 6 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#faf5ea",
                color: "var(--accent-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "1rem",
                border: "1.5px solid var(--accent)",
              }}
            >
              6
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>
              Earn From Every Sale
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Track every verified customer purchase in real time through your author dashboard with clear transparent revenue attribution.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Platform Features & Benefits ──────────────────────────────── */}
      <section style={{ backgroundColor: "#faf8f5", padding: "5rem 1rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="section-title">Why Publish With Veeer Sukhadiya Books?</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: 600, margin: "0.5rem auto 0" }}>
              A modern publishing ecosystem designed for authors who value craftsmanship and reader accessibility.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem" }}>
            <div className="why-us-card">
              <h3>📖 In-Browser Reader Delivery</h3>
              <p>Readers access your book instantly on any smartphone, tablet, or desktop with no third-party app installations required.</p>
            </div>
            <div className="why-us-card">
              <h3>💳 Seamless Razorpay Payments</h3>
              <p>Customers purchase securely using UPI, Credit/Debit cards, and Net Banking through our integrated checkout flow.</p>
            </div>
            <div className="why-us-card">
              <h3>📊 Real-Time Author Dashboard</h3>
              <p>Track submission statuses, review feedback, reader metrics, and sales revenue transparently in one place.</p>
            </div>
            <div className="why-us-card">
              <h3>✍️ Author Branding & Rights</h3>
              <p>Retain 100% intellectual property rights. Showcase your pen name with a dedicated public author profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="container" style={{ padding: "4rem 1rem 6rem" }}>
        <div className="bottom-cta-banner">
          <h2>Ready to Publish Your Next Book?</h2>
          <p>
            Join Veeer Sukhadiya Books today. Submit your manuscript and let our editorial team prepare your digital publication.
          </p>
          <button
            onClick={handleStartPublishing}
            className="btn btn-primary"
            style={{ padding: "1rem 2.5rem", fontSize: "1.1rem", fontWeight: 700 }}
          >
            {loadingProfile
              ? "Loading..."
              : isLoggedIn
              ? hasProfile
                ? "Open Author Hub →"
                : "Create Author Account →"
              : "Start Publishing Now"}
          </button>
        </div>
      </section>
    </main>
  );
}
