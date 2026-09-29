import Image from "next/image";
import Link from "next/link";
import BookGrid from "@/components/BookGrid";
import GiftSignup from "@/components/GiftSignup";
import { getAllBooks, toSummary, type BookSummary } from "@/lib/books";
import { canOptimize } from "@/lib/image";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Statically generated and refreshed at most once a minute (was: rebuilt + a
// database round-trip on every single visit).
export const revalidate = 60;

const FICTION_SLUGS = ["the-circle-of-ash", "the-shattered-sky", "fairy-tales-for-kids"];
const GUIDE_SLUGS = ["the-1-percent-rule", "the-student-success-system", "the-art-and-science-of-prompting"];

function isFiction(b: BookSummary) {
  const g = b.genre.toLowerCase();
  return FICTION_SLUGS.includes(b.slug) || ((g.includes("fiction") || g.includes("literature")) && !GUIDE_SLUGS.includes(b.slug));
}

const READER_FEATURES = [
  { t: "Opens instantly", d: "Pages stream one at a time, so a book opens in about a second — even on mobile data." },
  { t: "Contents & search", d: "Jump to any chapter, scan page thumbnails, or search every word in the book." },
  { t: "Bookmarks & resume", d: "Save pages you love. The reader remembers where you stopped, on every book." },
  { t: "Your way to read", d: "One page, two-page spread or continuous scroll. Zoom, fit width and full screen." },
  { t: "Easy on the eyes", d: "Dark, Light, Sepia and Night themes for comfortable reading at any hour." },
  { t: "Every device", d: "Swipe on phones, keyboard shortcuts on laptops. No app or download needed." },
];

export default async function HomePage() {
  const books = (await getAllBooks()).map(toSummary);
  const fictionBooks = books.filter(isFiction);
  const guideBooks = books.filter((b) => !isFiction(b));
  const featured = books.find((b) => b.slug === "the-1-percent-rule");
  const heroCovers = ["the-1-percent-rule", "the-circle-of-ash", "the-art-and-science-of-prompting"]
    .map((s) => books.find((b) => b.slug === s))
    .filter(Boolean) as BookSummary[];

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Veeer Sukhadiya Books · Est. 2025</span>
            <h1>Stories that grip you. Guides that change you.</h1>
            <p className="hero-sub">
              Author-published mystery, fantasy and self-improvement eBooks — bought once, read instantly in a fast
              reader built for phone, tablet and desktop.
            </p>
            <div className="hero-cta">
              <Link href="#collection" className="btn btn-primary">Browse the books</Link>
              {featured ? (
                <Link href={`/reader/${featured.slug}?preview=1`} className="btn btn-outline">Read a free preview</Link>
              ) : null}
            </div>
            <ul className="hero-points">
              <li>Instant access</li>
              <li>Lifetime library</li>
              <li>Secure Razorpay checkout</li>
            </ul>
          </div>

          <div className="hero-covers" aria-hidden="true">
            {heroCovers.map((b, i) => (
              <div className={`hero-cover hc-${i}`} key={b.id}>
                <Image
                  src={b.cover}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 34vw, 220px"
                  priority={i === 0}
                  unoptimized={!canOptimize(b.cover)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured: The 1% Rule, Expanded Edition ─────────── */}
      {featured ? (
        <section className="container" id="featured-release">
          <div className="featured">
            <div className="featured-cover">
              <Image
                src={featured.cover}
                alt={`${featured.title} cover`}
                fill
                sizes="(max-width: 768px) 60vw, 280px"
                unoptimized={!canOptimize(featured.cover)}
              />
            </div>
            <div className="featured-body">
              <span className="pill pill-new">New expanded edition</span>
              <h2>The 1% Rule</h2>
              <p className="featured-sub">A practical guide to transforming your life with small, consistent steps.</p>
              <p>
                Improve by one percent today, repeat tomorrow, and keep going. This new edition grows the book to{" "}
                {featured.pages} pages: sixteen chapters on health, learning, money, productivity, relationships and
                work — plus a 30-Day Blueprint and your own 1% Life Plan.
              </p>
              <ul className="featured-list">
                <li>Real-world examples and case studies in every chapter</li>
                <li>Action steps and a key takeaway you can use the same day</li>
                <li>30-day tracker, daily checklist and journaling prompts</li>
              </ul>
              <div className="price-row">
                <span className="price">₹{featured.price}</span>
                {featured.actualPrice && featured.actualPrice > featured.price ? (
                  <>
                    <s>₹{featured.actualPrice}</s>
                    <span className="save">
                      Save {Math.round(((featured.actualPrice - featured.price) / featured.actualPrice) * 100)}%
                    </span>
                  </>
                ) : null}
              </div>
              <div className="hero-cta left">
                <Link href={`/product/${featured.slug}`} className="btn btn-primary">View details</Link>
                <Link href={`/reader/${featured.slug}?preview=1`} className="btn btn-outline">Read free preview</Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Collection ───────────────────────────────────────── */}
      <section className="container" id="collection">
        <header className="section-head">
          <span className="eyebrow">The collection</span>
          <h2 className="section-title">Find your next read</h2>
        </header>

        {fictionBooks.length > 0 && (
          <div className="shelf">
            <h3 className="shelf-title">Fiction &amp; stories</h3>
            <BookGrid books={fictionBooks} />
          </div>
        )}

        {guideBooks.length > 0 && (
          <div className="shelf">
            <h3 className="shelf-title">Growth, AI &amp; productivity</h3>
            <BookGrid books={guideBooks} />
          </div>
        )}
      </section>

      {/* ─── Reader features ─────────────────────────────────── */}
      <section className="band">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">The reader</span>
            <h2 className="section-title">A reading experience built for comfort</h2>
            <p className="section-sub">Every book opens in the same fast web reader — nothing to install.</p>
          </header>
          <div className="feature-grid">
            {READER_FEATURES.map((f, i) => (
              <div className="feature" key={f.t}>
                <span className="feature-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About the author ────────────────────────────────── */}
      <section className="container home-gift" aria-label="Free book">
        <GiftSignup variant="card" source="home" />
      </section>

      <section className="container" id="about">
        <div className="about-grid">
          <div className="about-image">
            <Image
              src="/images/about.jpeg"
              alt="Veer Sukhadiya"
              width={800}
              height={1000}
              sizes="(max-width: 768px) 100vw, 520px"
            />
          </div>
          <div>
            <span className="eyebrow">Meet the author</span>
            <h2 className="section-title">Veer Sukhadiya</h2>
            <p className="lead">
              Veer Sukhadiya is a digital author and creator writing compelling fiction, practical self-improvement
              guides and technology resources.
            </p>
            <p className="muted">
              This bookstore is built for readers who value depth and good design: every title is written, designed and
              published directly by the author — no middlemen, fair prices, and a reader that works everywhere.
            </p>
            <div className="hero-cta left">
              <Link href="/author/veer-sukhadiya" className="btn btn-outline">Author profile</Link>
              <Link href="/publish" className="btn btn-outline">Publish with us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="container">
        <div className="bottom-cta-banner">
          <h2>Ready for your next read?</h2>
          <p>Instant, lifetime access. Read comfortably on any device, any time.</p>
          <Link href="#collection" className="btn btn-primary">Explore the collection</Link>
        </div>
      </section>
    </>
  );
}
