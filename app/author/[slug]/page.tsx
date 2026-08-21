import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import { AuthorProfile, BookModel } from "@/models";
import { BOOKS } from "@/lib/books";
import BookGrid from "@/components/BookGrid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAuthorData(slug: string) {
  await connectDB();
  const cleanSlug = slug.toLowerCase().trim();

  // Special case for platform founder / in-house author
  if (cleanSlug === "veer-sukhadiya" || cleanSlug === "veer") {
    const inHouseBooks = await BookModel.find({ isActive: true }).lean();
    return {
      author: {
        penName: "Veer Sukhadiya",
        slug: "veer-sukhadiya",
        biography:
          "Veer Sukhadiya is a digital author and creator dedicated to writing compelling fiction, practical self-improvement guides, and cutting-edge technology resources. All publications feature high-quality interactive web readers optimized for all devices.",
        profilePhoto: "/images/about.jpeg",
        website: "https://veeerbooks.in",
        authorType: "Individual Author",
        socialLinks: {},
      },
      books: (inHouseBooks.length > 0 ? inHouseBooks : BOOKS).map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        author: b.author,
        price: (b as any).price || (b as any).sellingPrice || 149,
        color: b.color || "#2c3e50",
        accent: b.accent || "#1a252f",
        genre: b.genre || "General",
        pages: b.pages || 100,
        cover: b.cover || "/images/default-book.svg",
        reader: b.reader || `/readers/${b.slug}.html`,
        pdf: b.pdf || "/books/default-book.pdf",
        description: b.description || "",
      })),
    };
  }

  const profile = await AuthorProfile.findOne({ slug: cleanSlug, status: "active" }).lean();
  if (!profile) return null;

  const publishedDocs = await BookModel.find({
    $or: [{ authorId: profile._id }, { authorSlug: profile.slug }],
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const books = publishedDocs.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author || profile.penName,
    price: b.sellingPrice || b.price || 149,
    actualPrice: b.actualPrice,
    color: b.color || "#2c3e50",
    accent: b.accent || "#1a252f",
    genre: b.genre || "General",
    pages: b.pages || 100,
    cover: b.cover || "/images/default-book.svg",
    reader: b.reader || `/readers/${b.slug}.html`,
    pdf: b.pdf || "/books/default-book.pdf",
    description: b.description || "",
  }));

  return {
    author: {
      penName: profile.penName,
      slug: profile.slug,
      biography: profile.biography || "",
      profilePhoto: profile.profilePhoto || "",
      website: profile.website || "",
      socialLinks: profile.socialLinks || {},
      authorType: profile.authorType,
    },
    books,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getAuthorData(params.slug);
  if (!data) return { title: "Author Not Found | Veeer Sukhadiya Books" };

  return {
    title: `${data.author.penName} | Author Profile | Veeer Sukhadiya Books`,
    description:
      data.author.biography ||
      `Explore digital books and novels written by ${data.author.penName} on Veeer Sukhadiya Books.`,
    openGraph: {
      title: `${data.author.penName} | Veeer Sukhadiya Books`,
      description: data.author.biography,
      images: data.author.profilePhoto ? [{ url: data.author.profilePhoto }] : [],
    },
  };
}

export default async function PublicAuthorPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getAuthorData(params.slug);
  if (!data) notFound();

  const { author, books } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.penName,
    url: `https://veeerbooks.in/author/${author.slug}`,
    image: author.profilePhoto || undefined,
    description: author.biography,
    sameAs: Object.values(author.socialLinks || {}).filter(Boolean),
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-paper)", padding: "4rem 1rem 6rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container" style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "2rem" }}>
          <Link href="/" style={{ color: "var(--accent-dark)", fontWeight: 600 }}>Home</Link>
          <span style={{ margin: "0 0.4rem" }}>/</span>
          <span style={{ color: "#64748b" }}>Authors</span>
          <span style={{ margin: "0 0.4rem" }}>/</span>
          <span style={{ color: "var(--text-main)" }}>{author.penName}</span>
        </nav>

        {/* ─── Author Bio Header Card ──────────────────────────────────── */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            padding: "2.5rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            marginBottom: "3.5rem",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "2.5rem",
            alignItems: "center",
          }}
        >
          {/* Author Photo */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid var(--accent)",
              boxShadow: "0 10px 25px rgba(197, 160, 89, 0.2)",
              backgroundColor: "var(--bg-paper-dark)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {author.profilePhoto ? (
              <Image
                src={author.profilePhoto}
                alt={author.penName}
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: "var(--accent-dark)",
                }}
              >
                {author.penName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Author Details */}
          <div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
              <span className="meta-pill" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 700 }}>
                {author.authorType}
              </span>
              <span className="meta-pill">
                {books.length} Published {books.length === 1 ? "Book" : "Books"}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--serif)",
                fontSize: "2.4rem",
                fontWeight: 800,
                color: "var(--text-main)",
                margin: "0 0 0.75rem 0",
              }}
            >
              {author.penName}
            </h1>

            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>
              {author.biography ||
                `${author.penName} is a published digital creator on Veeer Sukhadiya Books.`}
            </p>

            {/* Social / Website Links */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              {author.website && (
                <a
                  href={author.website.startsWith("http") ? author.website : `https://${author.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ gap: "0.4rem" }}
                >
                  🌐 Official Website
                </a>
              )}
              {(author.socialLinks as any)?.twitter && (
                <a
                  href={`https://twitter.com/${(author.socialLinks as any).twitter.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Twitter / X
                </a>
              )}
              {(author.socialLinks as any)?.instagram && (
                <a
                  href={`https://instagram.com/${(author.socialLinks as any).instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Instagram
                </a>
              )}
              {(author.socialLinks as any)?.linkedin && (
                <a
                  href={(author.socialLinks as any).linkedin.startsWith("http") ? (author.socialLinks as any).linkedin : `https://${(author.socialLinks as any).linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ─── Published Books Section ─────────────────────────────────── */}
        <section>
          <div style={{ marginBottom: "2rem" }}>
            <h2 className="section-title" style={{ padding: 0 }}>
              Books by {author.penName}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
              Instant digital access with custom in-browser reading modes.
            </p>
          </div>

          {books.length === 0 ? (
            <div className="library-empty">
              <p>No published books available from this author yet.</p>
              <Link href="/" className="btn btn-primary">
                Browse All Books
              </Link>
            </div>
          ) : (
            <BookGrid books={books} />
          )}
        </section>
      </div>
    </main>
  );
}
