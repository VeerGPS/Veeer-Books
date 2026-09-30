import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BOOKS, getBookBySlugFromDB } from "@/lib/books";
import ProductActions from "./ProductActions";
import { canOptimize } from "@/lib/image";
import ShareBar from "./ShareBar";
import LaunchCountdown from "@/components/LaunchCountdown";
import ProductPrice from "@/components/ProductPrice";
import BookReviews, { Stars } from "@/components/BookReviews";
import { getBookReviews } from "@/lib/reviews";
import { SITE_NAME, absUrl, jsonLd } from "@/lib/site";

// Pre-rendered and refreshed every minute instead of hitting the database on every visit.
export const revalidate = 60;

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
  const description = (book.hook || book.description || "").replace(/\s+/g, " ").trim().slice(0, 300);
  const url = `/product/${book.slug}`;
  const image = book.cover ? absUrl(book.cover) : undefined;
  return {
    title: `${book.title} by ${book.author} — eBook`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "book",
      url,
      title: `${book.title} by ${book.author}`,
      description,
      images: image ? [{ url: image, alt: `${book.title} cover` }] : undefined,
    },
    twitter: { card: "summary_large_image", title: book.title, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const book = await getBookBySlugFromDB(params.slug);
  if (!book) notFound();


  const pageUrl = absUrl(`/product/${book.slug}`);
  const { summary: reviewSummary, reviews } = await getBookReviews(book.id);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Book", "Product"],
        "@id": `${pageUrl}#book`,
        name: book.title,
        url: pageUrl,
        image: book.cover ? absUrl(book.cover) : undefined,
        description: (book.description || book.hook || "").slice(0, 5000),
        author: { "@type": "Person", name: book.author, url: book.authorSlug ? absUrl(`/author/${book.authorSlug}`) : undefined },
        publisher: { "@type": "Organization", name: SITE_NAME },
        bookFormat: "https://schema.org/EBook",
        numberOfPages: book.pages || undefined,
        genre: book.genre,
        inLanguage: "en",
        brand: { "@type": "Brand", name: SITE_NAME },
        sku: String(book.id),
        ...(reviewSummary.count > 0
          ? {
              aggregateRating: { "@type": "AggregateRating", ratingValue: reviewSummary.average, reviewCount: reviewSummary.count, bestRating: 5, worstRating: 1 },
              review: reviews.slice(0, 5).map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.name },
                datePublished: r.createdAt.slice(0, 10),
                reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
                name: r.title || undefined,
                reviewBody: r.body,
              })),
            }
          : {}),
        offers: {
          "@type": "Offer",
          url: pageUrl,
          price: book.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
          { "@type": "ListItem", position: 2, name: book.genre, item: absUrl("/#collection") },
          { "@type": "ListItem", position: 3, name: book.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="product-page" style={{ padding: "4rem 1rem", backgroundColor: "#fdfbf7" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <div className="container" style={{ maxWidth: 1080, margin: "0 auto" }}>
        
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
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
                aspectRatio: "2 / 3",
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
                sizes="(max-width: 640px) 90vw, 340px"
                style={{ objectFit: "cover" }}
                unoptimized={!canOptimize(book.cover)}
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
                Fast web reader · contents, search &amp; bookmarks
              </div>
            </div>
          </aside>

          {/* Right Column: Title, Hook, Price, CTAs */}
          <article>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.6rem" }}>
              <span className="meta-pill" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 700 }}>
                {book.genre}
              </span>
              <span className="meta-pill">{book.pages} Pages</span>
              <span className="meta-pill">Instant digital access</span>
            </div>

            <h1 className="product-title" style={{ fontSize: "2.25rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", marginBottom: "0.4rem", lineHeight: 1.25 }}>
              {book.title}
            </h1>
            <p className="product-author" style={{ color: "#8c7647", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.85rem" }}>
              By{" "}
              <Link
                href={`/author/${book.authorSlug || (book.author.toLowerCase().includes("veer") ? "veer-sukhadiya" : book.author.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}
                style={{ color: "#8c7647", textDecoration: "underline" }}
              >
                {book.author}
              </Link>
            </p>

            {reviewSummary.count > 0 ? (
              <a href="#reviews" className="rating-inline">
                <Stars value={reviewSummary.average} /> <b>{reviewSummary.average.toFixed(1)}</b> · {reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"}
              </a>
            ) : null}

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
                {book.launchEndsAt ? "Launch price" : "Digital Price"}
              </div>
              <ProductPrice book={{ price: book.price, actualPrice: book.actualPrice, regularPrice: book.regularPrice, foreign: book.foreign }} />
              {book.launchEndsAt ? <LaunchCountdown endsAt={book.launchEndsAt} regular={book.regularPrice ? { price: book.regularPrice, foreign: book.foreign } : undefined} /> : null}
            </div>

            {/* Action Buttons: Buy Now, Add to Cart, Read Free Preview */}
            <ProductActions bookId={book.id} slug={book.slug} />
            <ShareBar url={pageUrl} title={book.title} />
          </article>
        </section>

        {/* ─── WHAT YOU'LL GET & WHO IS THIS FOR (2 Grid Cards) ─── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "1.75rem", marginBottom: "3rem" }}>
          
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

          <p style={{ color: "#d6d3d1", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>
            {book.authorBio || "Veer Sukhadiya is a digital author and creator dedicated to writing compelling fiction, practical self-improvement guides, and cutting-edge technology resources. With a focus on reader accessibility, every book opens in a fast, feature-rich web reader."}
          </p>

          <Link
            href={`/author/${book.authorSlug || (book.author.toLowerCase().includes("veer") ? "veer-sukhadiya" : book.author.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}
            className="btn btn-outline btn-sm"
            style={{ color: "#c5a059", borderColor: "#c5a059" }}
          >
            View Author Profile & All Books →
          </Link>
        </section>

        {/* ─── Ratings & reviews (bottom of every book page) ─── */}
        <BookReviews bookId={book.id} bookTitle={book.title} initialSummary={reviewSummary} initialReviews={reviews} />
      </div>
    </main>
  );
}
