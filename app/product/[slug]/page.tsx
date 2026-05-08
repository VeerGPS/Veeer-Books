import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BOOKS, getBookBySlug } from "@/lib/books";
import AddToCartButton from "./AddToCartButton";

// Static pre-rendering for all 5 books → instant navigation
export function generateStaticParams() {
  return BOOKS.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const book = getBookBySlug(params.slug);
  if (!book) return { title: "Product Not Found" };
  return {
    title: `${book.title} | Veeer Sukhadiya Books`,
    description: book.description,
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const book = getBookBySlug(params.slug);
  if (!book) notFound();

  return (
    <main className="product-page">
      <section className="container product-wrap">
        <aside className="product-cover">
          <Image
            src={book.cover}
            alt={`${book.title} cover`}
            width={400}
            height={600}
            priority
            sizes="(max-width: 860px) 90vw, 380px"
          />
        </aside>

        <article>
          <h1 className="product-title">{book.title}</h1>
          <p className="product-author">By {book.author}</p>

          <div className="product-meta">
            <span className="meta-pill">{book.genre}</span>
            <span className="meta-pill">{book.pages} pages</span>
            <span className="meta-pill">Digital Edition</span>
          </div>

          <div className="product-price">INR {book.price.toFixed(2)}</div>

          <p className="product-copy">{book.description}</p>

          <div className="product-actions">
            <AddToCartButton bookId={book.id} />
            <Link className="btn btn-outline" href="/">
              Back to Store
            </Link>
          </div>

          {book.highlights && book.highlights.length > 0 && (
            <>
              <h3 style={{ fontFamily: "var(--serif)", marginBottom: "0.5rem" }}>
                Inside This Book
              </h3>
              <ul className="product-list">
                {book.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
