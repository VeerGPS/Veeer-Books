import Link from "next/link";
import { getActivePublishingAgreement, DEFAULT_AGREEMENT_VERSION } from "@/lib/publishing-agreement";
import { getPlatformSettings } from "@/lib/platform-settings";
import PublishingAgreementDocument from "@/components/PublishingAgreementDocument";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digital Publishing Agreement | Veeer Sukhadiya Books",
  description: "Official Digital Publishing Agreement and terms for authors publishing on Veeer Sukhadiya Books.",
};

export default async function PublishingAgreementPage() {
  const agreement = await getActivePublishingAgreement();
  const settings = await getPlatformSettings();

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "4rem 1rem 6rem" }}>
      <div className="container" style={{ maxWidth: 920, margin: "0 auto" }}>
        
        {/* Navigation / Header links */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <Link href="/publish" style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            ← Back to Publishing Overview
          </Link>
          <Link href="/author/dashboard" style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            Author Dashboard →
          </Link>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "3.5rem 3rem",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 25px rgba(0,0,0,0.03)",
          }}
        >
          {/* Main Agreement Document */}
          <PublishingAgreementDocument
            version={agreement?.version || DEFAULT_AGREEMENT_VERSION}
            lastUpdated="August 2026"
          />

          {/* Content Guidelines Section */}
          <hr style={{ margin: "3rem 0", borderColor: "var(--border)" }} />

          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", marginBottom: "1rem", color: "var(--text-main)" }}>
            Author Content & Quality Guidelines
          </h2>

          <div style={{ color: "#334155", lineHeight: 1.8, fontSize: "0.98rem", whiteSpace: "pre-line", marginBottom: "2.5rem" }}>
            {settings.contentGuidelinesText}
          </div>

          {/* CTA Box */}
          <div
            style={{
              backgroundColor: "#faf8f5",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid var(--accent)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.25rem",
            }}
          >
            <div>
              <strong style={{ fontSize: "1.15rem", color: "var(--text-main)", display: "block", marginBottom: "0.2rem" }}>
                Ready to publish your book?
              </strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
                Join our curated platform and reach digital readers with custom interactive web editions.
              </span>
            </div>
            <Link href="/publish" className="btn btn-primary" style={{ fontWeight: 700, padding: "0.8rem 1.75rem" }}>
              Start Publishing →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
