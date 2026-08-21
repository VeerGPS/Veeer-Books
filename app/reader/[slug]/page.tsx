import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BOOKS, getBookBySlugFromDB } from "@/lib/books";
import PreviewIframeContainer from "./PreviewIframeContainer";

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
  if (!book) return { title: "Book Reader" };
  return {
    title: `Reading: ${book.title} | Veeer Sukhadiya Books`,
    description: book.description,
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

  const isPreview =
    searchParams?.preview === "true" ||
    searchParams?.preview === "1" ||
    searchParams?.preview === "yes";

  // Determine reader source URL
  let readerSrc = book.reader;
  const cleanSlug = params.slug.toLowerCase();
  if (cleanSlug.includes("circle")) {
    readerSrc = "/readers/the-circle-of-ash.html";
  } else if (cleanSlug.includes("prompting")) {
    readerSrc = "/readers/The_Art_and_Science_of_Prompting_Reader-1.html";
  } else if (cleanSlug.includes("percent")) {
    readerSrc = "/readers/the-1-percent-rule.html";
  } else if (cleanSlug.includes("shattered")) {
    readerSrc = "/readers/the-shattered-sky.html";
  } else if (cleanSlug.includes("fairy")) {
    readerSrc = "/readers/fairy-tales-for-kids.html";
  } else if (cleanSlug.includes("student")) {
    readerSrc = "/readers/the-student-success-system.html";
  } else if (!readerSrc || readerSrc === "/readers/default-reader.html") {
    readerSrc = `/readers/${params.slug}.html`;
  }

  // If static reader HTML file or uploaded reader HTML exists, render full 100% immersive reader
  if (readerSrc && readerSrc.endsWith(".html")) {
    return (
      <PreviewIframeContainer
        readerSrc={readerSrc}
        title={book.title}
        isPreview={isPreview}
        bookSlug={book.slug}
        bookPrice={book.price}
      />
    );
  }

  // Fallback: render HTML content or readable book details
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

        {book.htmlContent ? (
          <article
            style={{
              lineHeight: 1.8,
              fontSize: "1.1rem",
              backgroundColor: "#1e293b",
              padding: "2.5rem",
              borderRadius: "12px",
              border: "1px solid #334155",
            }}
            dangerouslySetInnerHTML={{ __html: book.htmlContent }}
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
