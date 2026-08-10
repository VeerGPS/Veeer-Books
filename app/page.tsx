import Image from "next/image";
import Link from "next/link";
import BookGrid from "@/components/BookGrid";
import { getAllBooks } from "@/lib/books";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server component — renders the optimized, reader-focused homepage layout.
export default async function HomePage() {
  const books = await getAllBooks();

  // Curated shelf filtering
  const fictionBooks = books.filter(
    (b) =>
      b.genre.toLowerCase().includes("fiction") ||
      b.genre.toLowerCase().includes("literature") ||
      ["the-circle-of-ash", "the-shattered-sky", "fairy-tales-for-kids"].includes(b.slug)
  );

  const guideBooks = books.filter(
    (b) =>
      b.genre.toLowerCase().includes("help") ||
      b.genre.toLowerCase().includes("productivity") ||
      b.genre.toLowerCase().includes("ai") ||
      b.genre.toLowerCase().includes("technology") ||
      ["the-1-percent-rule", "the-student-success-system", "the-art-and-science-of-prompting"].includes(b.slug)
  );

  return (
    <>
      {/* ─── Reader-Focused Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="container" style={{ maxWidth: 850 }}>
          <span className="hero-badge">Est. 2025</span>
          <h1 style={{ fontSize: "2.85rem", lineHeight: 1.25, fontWeight: 800 }}>
            Dive Into Worlds That Captivate Your Mind & Ignite Your Habits
          </h1>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, color: "var(--text-muted)", marginTop: "1rem" }}>
            Veeer Sukhadiya Books brings you exclusive, author-published digital novels, suspenseful mystery fiction, and productivity resources. Open and read instantly with our custom browser reader—optimized for phone, tablet, and desktop.
          </p>
          <div className="hero-cta" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
            <Link href="#collection" className="btn btn-primary">
              Explore Books
            </Link>
            <Link href="#featured-release" className="btn btn-outline">
              Featured Release
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Release Section ────────────────────────────────────── */}
      <section className="container" id="featured-release" style={{ paddingTop: "3rem" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "1px" }}>
            ★ Reader Choice
          </span>
          <h2 className="section-title" style={{ padding: 0, marginTop: "0.5rem" }}>Featured Release</h2>
        </div>

        <div className="featured-book-section">
          {/* Cover image Column */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 260,
                aspectRatio: "2/3",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1.5px solid #c5a059",
                boxShadow: "0 15px 40px rgba(0, 0, 0, 0.16)",
              }}
            >
              <Image
                src="/images/the-circle-of-ash.png"
                alt="The Circle of Ash Cover"
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>
          </div>

          {/* Book Info Column */}
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-dark)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PSYCHOLOGICAL SUSPENSE NOVEL
            </span>
            <h3 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0.5rem 0", fontFamily: "var(--serif)" }}>
              The Circle of Ash: Where Truth Refuses to Burn
            </h3>
            <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              By <strong>Veer Sukhadiya</strong> &nbsp;|&nbsp; 104 Pages
            </span>

            <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.7, margin: "1.25rem 0" }}>
              A suspense-driven thriller where every clue deepens the mystery and every chapter pulls you closer to a hidden truth. If you enjoy psychological tension, layered reveals, and emotionally charged storytelling, this book is crafted for you.
            </p>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", margin: "1.25rem 0" }}>
              <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent)" }}>
                INR 180.00
              </span>
              <span style={{ fontSize: "1.05rem", textDecoration: "line-through", color: "#a8a29e" }}>
                INR 249.00
              </span>
              <span style={{ backgroundColor: "rgba(197, 160, 89, 0.15)", color: "#9a7d36", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 800 }}>
                SAVE 27%
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
              <Link href="/product/the-circle-of-ash" className="btn btn-primary">
                View Details
              </Link>
              <Link href="/reader/the-circle-of-ash?preview=1" className="btn btn-outline">
                📖 Read Free Preview
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Curated Bookshelf Collection ────────────────────────────────── */}
      <section className="container" id="collection" style={{ scrollMarginTop: "2rem" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 className="section-title">The Curated Collection</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: 600, margin: "0.5rem auto 0" }}>
            Handpicked digital titles. No catalog diving required—find your next favorite book instantly by shelf category.
          </p>
        </div>

        {/* Shelf 1: Fiction */}
        {fictionBooks.length > 0 && (
          <div style={{ marginBottom: "4rem" }}>
            <h3 className="category-shelf-title">📚 Immersive Fiction & Stories</h3>
            <BookGrid books={fictionBooks} />
          </div>
        )}

        {/* Shelf 2: Self-Help & Tech */}
        {guideBooks.length > 0 && (
          <div style={{ marginBottom: "4rem" }}>
            <h3 className="category-shelf-title">⚡ Growth, AI & Productivity Guides</h3>
            <BookGrid books={guideBooks} />
          </div>
        )}
      </section>

      {/* ─── Why VeeerBooks Value Proposition ────────────────────────────── */}
      <section style={{ backgroundColor: "#faf8f5", padding: "5rem 0", borderTop: "1px solid #e2ddd3", borderBottom: "1px solid #e2ddd3" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="section-title">Why Read on Veeer Sukhadiya Books?</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: 600, margin: "0.5rem auto 0" }}>
              Our eBooks are built to offer a premium, native reading experience across all viewports.
            </p>
          </div>

          <div className="why-us-grid">
            <div className="why-us-card">
              <h3>📖 Standalone Web Readers</h3>
              <p>No downloads or heavy apps required. Open your purchased books immediately inside any web browser on iOS, Android, or desktop.</p>
            </div>
            <div className="why-us-card">
              <h3>🌙 Custom Comfort Settings</h3>
              <p>Toggle comfortably between Light, Sepia, and Night reading modes. Adjust font sizes dynamically for strain-free reading sessions.</p>
            </div>
            <div className="why-us-card">
              <h3>⚡ Lifetime Access & Syncing</h3>
              <p>Once purchased, books are securely saved to your personal library forever. Read and return anytime on any connected device.</p>
            </div>
            <div className="why-us-card">
              <h3>🎯 Author-Led Quality</h3>
              <p>Original digital publications written, designed, and curated directly by the author with no publisher markup or bloated fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials/Reviews ────────────────────────────────────────── */}
      <section className="container" style={{ marginTop: "5rem" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "1px" }}>
            Testimonials
          </span>
          <h2 className="section-title" style={{ padding: 0, marginTop: "0.5rem" }}>What Readers Say</h2>
        </div>

        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p>&ldquo;Unputdownable! The pacing kept me hooked from page one. The standalone browser reader made reading so smooth.&rdquo;</p>
            <div className="author-info">
              <strong>Aarav Sharma</strong>
              <span style={{ color: "#f59e0b" }}>★★★★★</span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: 600, display: "block", marginTop: "0.4rem" }}>✓ Verified Reader</span>
          </div>

          <div className="testimonial-card">
            <p>&ldquo;Short, crisp, and direct to the point. No fluff! Applied the daily habit compounding framework immediately.&rdquo;</p>
            <div className="author-info">
              <strong>Vikram Malhotra</strong>
              <span style={{ color: "#f59e0b" }}>★★★★★</span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: 600, display: "block", marginTop: "0.4rem" }}>✓ Verified Reader</span>
          </div>

          <div className="testimonial-card">
            <p>&ldquo;A masterpiece of psychological tension. The plot twists near the end genuinely blew my mind. Absolutely loved it!&rdquo;</p>
            <div className="author-info">
              <strong>Priya Patel</strong>
              <span style={{ color: "#f59e0b" }}>★★★★★</span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: 600, display: "block", marginTop: "0.4rem" }}>✓ Verified Reader</span>
          </div>
        </div>
      </section>

      {/* ─── About & Credibility ─────────────────────────────────────────── */}
      <section className="container" id="about" style={{ marginTop: "2rem" }}>
        <div className="about-grid">
          <div className="about-image">
            <Image
              src="/images/about.jpeg"
              alt="About Veer Sukhadiya"
              width={800}
              height={1000}
              sizes="(max-width: 768px) 100vw, 600px"
              style={{ borderRadius: "16px", border: "1px solid #e2ddd3" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "1px" }}>
              MEET THE AUTHOR
            </span>
            <h2 className="section-title" style={{ padding: 0, marginTop: "0.5rem", marginBottom: "1.5rem" }}>
              Veer Sukhadiya
            </h2>
            <p style={{ lineHeight: 1.75 }}>
              Veer Sukhadiya is a digital author and creator dedicated to writing compelling fiction, practical self-improvement guides, and cutting-edge technology resources. All publications feature high-quality interactive web readers optimized for all devices.
            </p>
            <p style={{ marginBottom: "2rem", marginTop: "1rem", lineHeight: 1.75, color: "var(--text-muted)" }}>
              Our bookstore is more than a marketplace; it is a sanctuary for those who value depth, editorial excellence, and the quiet power of a well-turned digital page. We aim to make reading accessible, beautiful, and affordable for everyone.
            </p>
            <div>
              <Link href="#collection" className="btn btn-primary">
                Browse Publications
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ───────────────────────────────────────────── */}
      <section className="container">
        <div className="bottom-cta-banner">
          <h2>Ready to start your next reading journey?</h2>
          <p>Get instant, lifetime digital access to all eBooks. Read comfortably from any device, anytime.</p>
          <Link href="#collection" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.05rem" }}>
            Explore the Full Collection
          </Link>
        </div>
      </section>
    </>
  );
}
