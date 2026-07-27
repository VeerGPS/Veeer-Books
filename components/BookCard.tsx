"use client";

import Link from "next/link";
import Image from "next/image";
import type { Book } from "@/lib/books";

export default function BookCard({ book }: { book: Book }) {
  const productHref = `/product/${book.slug}`;

  return (
    <article className="book-card fade-in">
      <Link
        href={productHref}
        className="book-cover-wrap"
        style={{ background: book.color }}
      >
        <Image
          src={book.cover || "/images/default-book.svg"}
          alt={book.title}
          width={300}
          height={450}
          className="book-cover-img"
          sizes="(max-width: 768px) 50vw, 280px"
          unoptimized
        />
      </Link>

      <div className="book-info">
        <Link href={productHref}>
          <h3>{book.title}</h3>
        </Link>
        <p className="book-author">{book.author}</p>
        <div className="book-price">INR {book.price}</div>
      </div>
    </article>
  );
}
