"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useModal } from "@/contexts/ModalContext";
import LovedIt from "./LovedIt";
import { BookPriceText } from "@/components/Price";
import type { ForeignOverride } from "@/lib/currency";

const PREVIEW_PAGES = 8;

interface PreviewIframeProps {
  readerSrc: string;
  title: string;
  isPreview: boolean;
  bookId: number;
  bookSlug: string;
  bookPrice: number;
  bookGenre?: string;
  bookRegularPrice?: number;
  bookForeign?: ForeignOverride;
}

const gold = "#c5a059";

export default function PreviewIframeContainer({
  readerSrc,
  title,
  isPreview,
  bookId,
  bookSlug,
  bookPrice,
  bookGenre,
  bookRegularPrice,
  bookForeign,
}: PreviewIframeProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [endMode, setEndMode] = useState<"preview" | "finished">("preview");
  const { isReady, isLoggedIn, purchasedBooks } = useAuth();
  const { add, hasItem } = useCart();
  const { show } = useModal();

  const owned = purchasedBooks.includes(bookId);
  const locked = !isPreview && isReady && !owned;

  // Messages from the reader inside the iframe (same origin only).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !e.data) return;
      const d = e.data as { source?: string; type?: string };
      if (d.type === "PREVIEW_LIMIT_REACHED") { setEndMode("preview"); return setShowModal(true); } // older readers
      if (d.source !== "veeer-reader") return;
      if (d.type === "preview-end") { setEndMode("preview"); setShowModal(true); }
      if (d.type === "book-end") { setEndMode("finished"); setShowModal(true); }
      if (d.type === "buy") { if (!hasItem(bookId)) add(bookId); router.push("/cart"); }
      if (d.type === "review") router.push(`/product/${bookSlug}#reviews`);
      if (d.type === "close") router.push(isPreview ? `/product/${bookSlug}` : "/library");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [router, isPreview, bookSlug, bookId, add, hasItem]);

  const buy = () => {
    if (!hasItem(bookId)) add(bookId);
    router.push("/cart");
  };

  const sep = readerSrc.includes("?") ? "&" : "?";
  const iframeSrc = isPreview ? `${readerSrc}${sep}preview=1&pages=${PREVIEW_PAGES}` : readerSrc;
  const priceBook = { price: bookPrice, regularPrice: bookRegularPrice, foreign: bookForeign };
  const price = <BookPriceText book={priceBook} />;

  // Full reading is for owners; everyone else gets the free preview.
  if (!isPreview && !isReady) {
    return <div style={{ position: "fixed", inset: 0, background: "#2b2b2b" }} aria-busy="true" />;
  }
  if (locked) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#1c1917", display: "grid", placeItems: "center", padding: "1.5rem" }}>
        <div style={{ maxWidth: 440, width: "100%", background: "#faf8f5", borderRadius: 18, padding: "2rem", textAlign: "center", border: `2px solid ${gold}` }}>
          <div style={{ fontSize: "2rem" }}>📖</div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", margin: "0.5rem 0" }}>{title}</h1>
          <p style={{ color: "#5a5a5a", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {isLoggedIn
              ? "This book isn’t in your library yet. Read the free preview or get the full book."
              : "Sign in to read books from your library, or start with the free preview."}
          </p>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            <Link href={`/reader/${bookSlug}?preview=1`} className="btn btn-primary">
              Read free preview ({PREVIEW_PAGES} pages)
            </Link>
            <button type="button" className="btn btn-outline" onClick={buy}>
              Get the full book — {price}
            </button>
            {!isLoggedIn ? (
              <button type="button" className="btn btn-outline" onClick={() => show("login")}>
                Sign in
              </button>
            ) : null}
            <Link href={`/product/${bookSlug}`} style={{ color: "#8c7647", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              ← Back to book details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", backgroundColor: "#2b2b2b" }}>
      {isPreview ? (
        <div className="preview-bar">
          <div className="preview-bar-l">
            <span className="preview-tag">Free preview · {PREVIEW_PAGES} pages</span>
            <span className="preview-title">{title}</span>
          </div>
          <div className="preview-bar-r">
            <button type="button" className="preview-buy" onClick={buy}>
              Get full book · {price}
            </button>
            <Link href={`/product/${bookSlug}`} className="preview-exit">
              Exit
            </Link>
          </div>
        </div>
      ) : null}

      <iframe
        src={iframeSrc}
        title={title}
        allow="fullscreen"
        style={{ flex: 1, width: "100%", border: "none", display: "block" }}
      />

      {showModal ? (
        <LovedIt
          mode={endMode}
          book={{ id: bookId, slug: bookSlug, title, price: bookPrice, genre: bookGenre, regularPrice: bookRegularPrice, foreign: bookForeign }}
          onClose={() => setShowModal(false)}
        />
      ) : null}
    </div>
  );
}
