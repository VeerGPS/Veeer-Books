"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { BookSummary } from "@/lib/books";
import { canOptimize } from "@/lib/image";
import { trackMarketplaceEvent } from "@/lib/analytics";
import { BookPrice, BookPriceText } from "@/components/Price";
import type { ForeignOverride } from "@/lib/currency";

export type LovedItBook = { id: number; slug: string; title: string; price: number; genre?: string; regularPrice?: number; foreign?: ForeignOverride };

let catalogCache: BookSummary[] | null = null;

/**
 * "Loved it?" panel shown at the end of every preview and every finished book:
 * preview → buy this book + two more picks; finished → what to read next, rate, share.
 */
export default function LovedIt({
  mode,
  book,
  variant = "modal",
  onClose,
}: {
  mode: "preview" | "finished";
  book: LovedItBook;
  variant?: "modal" | "inline";
  onClose?: () => void;
}) {
  const router = useRouter();
  const { purchasedBooks } = useAuth();
  const { add } = useCart();
  const [catalog, setCatalog] = useState<BookSummary[]>(catalogCache || []);

  useEffect(() => {
    if (catalogCache) return;
    fetch("/api/books")
      .then((r) => r.json())
      .then((j) => { catalogCache = j.books || []; setCatalog(catalogCache!); })
      .catch(() => {});
  }, []);

  const genre = book.genre || catalog.find((b) => b.id === book.id)?.genre || "";
  const picks = useMemo(() => {
    const others = catalog.filter((b) => b.id !== book.id && !purchasedBooks.includes(b.id));
    const same = others.filter((b) => genre && b.genre === genre);
    const rest = others.filter((b) => !same.includes(b));
    return [...same, ...rest].slice(0, mode === "preview" ? 2 : 3);
  }, [catalog, book.id, purchasedBooks, genre, mode]);

  const buy = (id: number) => {
    add(id);
    trackMarketplaceEvent("external_book_add_to_cart");
    router.push("/cart");
  };

  const shareText = `I just read “${book.title}” on Veeer Sukhadiya Books — you’d love it!`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${book.slug}` : `/product/${book.slug}`;

  const body = (
    <div className={`loved loved-${variant}`}>
      {onClose ? <button className="loved-x" aria-label="Close" onClick={onClose}>×</button> : null}
      <div className="loved-emoji" aria-hidden="true">{mode === "preview" ? "💛" : "🎉"}</div>
      <h3 className="loved-h">{mode === "preview" ? "Loved the preview?" : <>Loved <i>{book.title}</i>?</>}</h3>

      {mode === "preview" ? (
        <>
          <p className="loved-p">Get the complete book to find out what happens next — instant access on every device.</p>
          <button className="btn btn-primary loved-main" onClick={() => buy(book.id)}>
            Get the full book — <BookPriceText book={book} />
          </button>
          {onClose ? <button className="loved-link" onClick={onClose}>Keep reading the preview</button> : null}
        </>
      ) : (
        <p className="loved-p">Here’s what to read next — picked for readers who enjoyed this one.</p>
      )}

      {picks.length ? (
        <>
          <div className="loved-sub">{mode === "preview" ? "More books you’ll love" : "Your next great read"}</div>
          <div className="loved-grid">
            {picks.map((b) => (
              <div className="loved-card" key={b.id}>
                <Link href={`/product/${b.slug}`} className="loved-cover" onClick={onClose}>
                  <Image src={b.cover || "/images/default-book.svg"} alt={`${b.title} cover`} width={96} height={144} sizes="96px" unoptimized={!canOptimize(b.cover)} />
                </Link>
                <div className="loved-info">
                  <Link href={`/product/${b.slug}`} className="loved-title" onClick={onClose}>{b.title}</Link>
                  <div className="loved-price">
                    <BookPrice book={b} />
                  </div>
                  <div className="loved-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => buy(b.id)}>Buy</button>
                    <Link href={`/reader/${b.slug}?preview=1`} className="btn btn-outline btn-sm">Free preview</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : mode === "finished" && catalog.length ? (
        <p className="loved-p">You’ve read every book in our store — thank you! New titles are on the way.</p>
      ) : null}

      {mode === "finished" ? (
        <div className="loved-foot">
          <Link href={`/product/${book.slug}#reviews`} className="btn btn-outline btn-sm">★ Rate this book</Link>
          <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
            onClick={() => trackMarketplaceEvent("book_shared")}>Share on WhatsApp</a>
          <Link href="/refer" className="btn btn-outline btn-sm">Refer &amp; earn</Link>
        </div>
      ) : null}
    </div>
  );

  if (variant === "inline") return body;
  return (
    <div className="loved-veil" role="dialog" aria-modal="true" aria-label={mode === "preview" ? "Loved the preview?" : "Loved it?"} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{body}</div>
    </div>
  );
}
