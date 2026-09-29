import Link from "next/link";
import Image from "next/image";
import type { BookSummary } from "@/lib/books";
import { canOptimize } from "@/lib/image";
import LaunchCountdown from "@/components/LaunchCountdown";

// Server component (only the optional launch countdown ships client JavaScript).
export default function BookCard({ book, priority = false }: { book: BookSummary; priority?: boolean }) {
  const productHref = `/product/${book.slug}`;
  const cover = book.cover || "/images/default-book.svg";
  const off =
    book.actualPrice && book.actualPrice > book.price
      ? Math.round(((book.actualPrice - book.price) / book.actualPrice) * 100)
      : 0;

  return (
    <article className="book-card">
      <Link href={productHref} className="book-cover-wrap" style={{ background: book.color }} aria-label={book.title}>
        <Image
          src={cover}
          alt={`${book.title} cover`}
          width={300}
          height={450}
          className="book-cover-img"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
          priority={priority}
          unoptimized={!canOptimize(cover)}
        />
        {off > 0 ? <span className="book-badge">−{off}%</span> : null}
      </Link>

      <div className="book-info">
        <span className="book-genre">{book.genre}</span>
        <Link href={productHref}>
          <h3>{book.title}</h3>
        </Link>
        <p className="book-author">{book.author}</p>
        <div className="book-price">
          ₹{book.price}
          {off > 0 ? <s>₹{book.actualPrice}</s> : null}
        </div>
        {book.launchEndsAt ? <LaunchCountdown endsAt={book.launchEndsAt} compact /> : null}
      </div>
    </article>
  );
}
