import Image from "next/image";
import Link from "next/link";
import BookGrid from "@/components/BookGrid";
import { BOOKS } from "@/lib/books";

// Server component — renders book grid statically at build time. The few
// interactive bits (CTA buttons that scroll, etc.) are simple anchors.

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Est. 2025</span>
          <h1>Discover Inspiring Stories and Digital Books</h1>
          <p>
            Welcome to my digital publishing platform where readers can
            explore engaging fiction eBooks, story books, and creative works.
            <br />
            <br />
            📚 Fiction eBooks &nbsp;|&nbsp; 📖 Story Books &nbsp;|&nbsp; ✍️
            Author-Led Online Publishing
          </p>
          <div className="hero-cta">
            <Link href="#collection" className="btn btn-primary">
              Explore Collection
            </Link>
            <Link href="#about" className="btn btn-outline">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Full collection ────────────────────────────────────── */}
      <section className="container" id="collection">
        <div className="section-header">
          <h2 className="section-title">The Collection</h2>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Showing all {BOOKS.length} titles
          </div>
        </div>
        <BookGrid books={BOOKS} />
      </section>

      {/* ─── New releases ───────────────────────────────────────── */}
      <section className="container" id="new-releases">
        <div className="section-header">
          <h2 className="section-title">New Releases</h2>
        </div>
        <BookGrid books={BOOKS.slice(0, 3)} />
      </section>

      {/* ─── Curated collections ────────────────────────────────── */}
      <section className="container" id="collections">
        <div className="section-header">
          <h2 className="section-title">Curated Collections</h2>
        </div>
        <div className="category-grid">
          <div className="category-card">
            <h3>Mystery Fiction</h3>
            <p>Crime &amp; Suspense</p>
          </div>
          <div className="category-card">
            <h3>Fiction</h3>
            <p>Young Age Fantasy</p>
          </div>
          <div className="category-card">
            <h3>Self Help</h3>
            <p>Personal Development / Growth</p>
          </div>
        </div>
        <BookGrid books={BOOKS} />
      </section>

      {/* ─── About ──────────────────────────────────────────────── */}
      <section className="container" id="about">
        <div className="about-grid">
          <div className="about-image">
            <Image
              src="/images/about.jpeg"
              alt="About Veeer Sukhadiya"
              width={800}
              height={1000}
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
          <div>
            <h2
              className="section-title"
              style={{ marginBottom: "1.5rem", paddingTop: 0 }}
            >
              Veeer Sukhadiya Books
            </h2>
            <p>
              Founded by <strong>Veer Sukhadiya</strong>, this platform is
              built to provide high-quality digital books and learning
              resources for students across India.
              <br />
              <br />
              Our mission: Make learning accessible, affordable, and powerful.
            </p>
            <p style={{ marginBottom: "2rem", marginTop: "1rem" }}>
              Our bookstore is more than a marketplace; it is a sanctuary for
              those who value depth, editorial excellence, and the quiet power
              of a well-turned phrase.
            </p>
            <Link href="#collection" className="btn btn-primary">
              Back to Store
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
