import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BOOKS, getBookBySlugFromDB } from "@/lib/books";
import ProductActions from "./ProductActions";
import ProductReviews from "./ProductReviews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return BOOKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const book = await getBookBySlugFromDB(params.slug);
  if (!book) return { title: "Product Not Found" };
  return {
    title: `${book.title} | Veeer Sukhadiya Books`,
    description: book.hook || book.description,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const book = await getBookBySlugFromDB(params.slug);
  if (!book) notFound();

  const savingsINR = book.actualPrice && book.actualPrice > book.price ? book.actualPrice - book.price : 0;
  const discountPct = book.actualPrice && book.actualPrice > book.price ? Math.round((savingsINR / book.actualPrice) * 100) : 0;

  return (
    <main className="product-page" style={{ padding: "4rem 1rem", backgroundColor: "#fdfbf7" }}>
      <div className="container" style={{ maxWidth: 1080, margin: "0 auto" }}>
        
        {/* Breadcrumb Navigation */}
        <nav style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "#8c7647", fontWeight: 600 }}>Home</Link>
          <span style={{ margin: "0 0.4rem" }}>/</span>
          <span style={{ color: "#8c7647", fontWeight: 600 }}>{book.genre}</span>
          <span style={{ margin: "0 0.4rem" }}>/</span>
          <span style={{ color: "#1a1a1a" }}>{book.title}</span>
        </nav>

        {/* ─── ABOVE THE FOLD SECTION (Cover + Title + Hook + Price + Format + CTAs) ─── */}
        <section className="product-detail-section">
          {/* Left Column: Book Cover & Format Badge */}
          <aside style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                height: 480,
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)",
                border: "2px solid #c5a059",
                backgroundColor: "#f4f1ea",
              }}
            >
              <Image
                src={book.cover || "/images/default-book.svg"}
                alt={`${book.title} cover`}
                fill
                priority
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>

            {/* Instant Digital Download Format Badge */}
            <div
              style={{
                marginTop: "1.25rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
                backgroundColor: "#faf8f5",
                border: "1px solid #c5a059",
                textAlign: "center",
                width: "100%",
                maxWidth: 340,
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c5a059", textTransform: "uppercase", letterSpacing: "1px" }}>
                ⚡ INSTANT DIGITAL EBOOK
              </span>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", marginTop: "0.2rem" }}>
                Interactive In-Browser eBook Reader Access
              </div>
            </div>
          </aside>

          {/* Right Column: Title, Hook, Price, CTAs */}
          <article>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.6rem" }}>
              <span className="meta-pill" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 700 }}>
                {book.genre}
              </span>
              <span className="meta-pill">{book.pages} Pages</span>
              <span className="meta-pill">Verified Digital Edition</span>
            </div>

            <h1 className="product-title" style={{ fontSize: "2.25rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", marginBottom: "0.4rem", lineHeight: 1.25 }}>
              {book.title}
            </h1>
            <p className="product-author" style={{ color: "#8c7647", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.85rem" }}>
              By {book.author}
            </p>

            {/* Strong One-Line Book Hook */}
            {book.hook ? (
              <p
                style={{
                  fontSize: "1.1rem",
                  fontStyle: "italic",
                  color: "#334155",
                  lineHeight: 1.5,
                  paddingLeft: "1rem",
                  borderLeft: "3px solid #c5a059",
                  marginBottom: "1.25rem",
                }}
              >
                &ldquo;{book.hook}&rdquo;
              </p>
            ) : null}

            {/* Price Callout */}
            <div style={{ margin: "1.25rem 0 1.5rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Digital Price
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)" }}>
                  INR {book.price.toFixed(2)}
                </span>
                {book.actualPrice && book.actualPrice > book.price ? (
                  <span style={{ fontSize: "1.2rem", color: "#94a3b8", textDecoration: "line-through" }}>
                    INR {book.actualPrice.toFixed(2)}
                  </span>
                ) : null}
                {discountPct > 0 ? (
                  <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 800 }}>
                    SAVE {discountPct}% (INR {savingsINR.toFixed(2)} OFF)
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action Buttons: Buy Now, Add to Cart, Read Free Preview */}
            <ProductActions bookId={book.id} slug={book.slug} />
          </article>
        </section>

        {/* ─── WHAT YOU'LL GET & WHO IS THIS FOR (2 Grid Cards) ─── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.75rem", marginBottom: "3rem" }}>
          
          {/* What You'll Get Card */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e2ddd3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🎁</span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", margin: 0 }}>
                What You&apos;ll Get
              </h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {(book.whatYouGet || []).map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "start", gap: "0.6rem", fontSize: "0.95rem", color: "#334155" }}>
                  <span style={{ color: "#15803d", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Who Is This Book For Card */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e2ddd3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🎯</span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", margin: 0 }}>
                Who Is This Book For?
              </h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {(book.whoIsThisFor || []).map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "start", gap: "0.6rem", fontSize: "0.95rem", color: "#334155" }}>
                  <span style={{ color: "#c5a059", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── SCANNABLE BOOK DESCRIPTION & HIGHLIGHTS ─── */}
        <section className="about-ebook-section">
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", marginBottom: "1rem" }}>
            About This eBook
          </h2>

          <div style={{ fontSize: "1.05rem", color: "#334155", lineHeight: 1.8, marginBottom: "1.75rem" }}>
            {book.description.split("\n\n").map((para, idx) => (
              <p key={idx} style={{ marginBottom: "1rem" }}>
                {para}
              </p>
            ))}
          </div>

          {book.highlights && book.highlights.length > 0 ? (
            <div style={{ backgroundColor: "#faf8f5", padding: "1.5rem", borderRadius: "12px", border: "1px solid #c5a059" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1a1a1a", fontFamily: "var(--serif)", marginBottom: "0.75rem" }}>
                Key Highlights & Takeaways
              </h3>
              <ul className="product-list" style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {book.highlights.map((h, i) => (
                  <li key={i} style={{ marginBottom: "0.4rem", color: "#334155" }}>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* ─── AUTHOR INFORMATION SECTION ─── */}
        <section className="author-bio-section">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#c5a059", color: "#1c1917", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 800 }}>
              VS
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#c5a059", textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px" }}>
                AUTHOR BIOGRAPHY
              </span>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", fontFamily: "var(--serif)", margin: "0.1rem 0 0 0" }}>
                About {book.author}
              </h3>
            </div>
          </div>

          <p style={{ color: "#d6d3d1", fontSize: "1rem", lineHeight: 1.7, margin: 0 }}>
            {book.authorBio || "Veer Sukhadiya is a digital author and creator dedicated to writing compelling fiction, practical self-improvement guides, and cutting-edge technology resources. With a focus on reader accessibility, all books include high-quality standalone eBook readers and instant PDF downloads."}
          </p>
        </section>

        {/* ─── GENUINE READER REVIEWS SECTION ─── */}
        <ProductReviews initialReviews={book.reviews} />

      </div>
    </main>
  );
}
