import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getBookBySlugFromDB } from "@/lib/books";
import PreviewIframeContainer from "./PreviewIframeContainer";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const book = await getBookBySlugFromDB(params.slug);
  if (!book) return { title: "Book Reader" };
  return {
    title: `Reading: ${book.title}`,
    description: book.description,
    robots: { index: false },
  };
}

export default async function DynamicReaderPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { preview?: string };
}) {
  const book = await getBookBySlugFromDB(params.slug);
  if (!book) notFound();

  const isPreview = ["true", "1", "yes"].includes(searchParams?.preview || "");

  // lib/books.ts already maps every built-in book to its fast shared reader.
  const readerSrc = book.reader || `/readers/${book.slug}.html`;

  if (readerSrc.endsWith(".html")) {
    return (
      <PreviewIframeContainer
        readerSrc={readerSrc}
        title={book.title}
        isPreview={isPreview}
        bookId={book.id}
        bookSlug={book.slug}
        bookPrice={book.price}
      />
    );
  }

  // Fallback: render the book's HTML content (only loaded when needed).
  const full = await getBookBySlugFromDB(params.slug, true);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <Link href={`/product/${book.slug}`} className="btn btn-outline btn-sm" style={{ color: "#c5a059", borderColor: "#c5a059" }}>
            ← Back to Product Page
          </Link>
          <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{book.genre}</span>
        </div>

        <h1 style={{ fontSize: "2.25rem", color: "#c5a059", marginBottom: "0.5rem" }}>{book.title}</h1>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: "2rem" }}>By {book.author}</p>

        {full?.htmlContent ? (
          <article
            style={{
              lineHeight: 1.8,
              fontSize: "1.1rem",
              backgroundColor: "#1e293b",
              padding: "2.5rem",
              borderRadius: "12px",
              border: "1px solid #334155",
            }}
            dangerouslySetInnerHTML={{ __html: full.htmlContent }}
          />
        ) : (
          <div style={{ backgroundColor: "#1e293b", padding: "2.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
            <p style={{ lineHeight: 1.8, fontSize: "1.1rem", marginBottom: "1.5rem" }}>{book.description}</p>
          </div>
        )}
      </div>
    </main>
  );
}
