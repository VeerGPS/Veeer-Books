"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GiftSignup, { isGiftClaimed } from "@/components/GiftSignup";
import { useDeals } from "@/contexts/DealsContext";

/**
 * On the free book's own product page: show the "get it free" email form in place of
 * price + Buy buttons. Once the reader has it, fall back to the normal actions (Read Now).
 */
export default function GiftBookOffer({ children }: { children: ReactNode }) {
  const { purchasedBooks, isReady } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const GIFT_BOOK = useDeals().gift;
  useEffect(() => { setClaimed(isGiftClaimed(GIFT_BOOK?.id)); }, [GIFT_BOOK?.id]);

  if (!GIFT_BOOK) return <>{children}</>;

  // Signed-in owner: the normal actions already show "Read Now".
  if (isReady && purchasedBooks.includes(GIFT_BOOK.id) && !justClaimed) return <>{children}</>;
  if (claimed || justClaimed) {
    return (
      <div className="gift gift-product gift-done" style={{ margin: "1.25rem 0 0.5rem" }}>
        <div className="gift-emoji" aria-hidden="true">🎁</div>
        <h3 style={{ margin: ".25rem 0 .4rem", fontFamily: "var(--serif)" }}>{GIFT_BOOK.title} is yours!</h3>
        <p>We’ve emailed you a link too, so you can read it on any device.</p>
        <Link href={`/reader/${GIFT_BOOK.slug}`} className="btn btn-primary" style={{ width: "100%" }}>📖 Start reading now</Link>
      </div>
    );
  }
  return (
    <div style={{ margin: "1.25rem 0 0.5rem" }}>
      <GiftSignup variant="product" source="product" onDone={() => setJustClaimed(true)} />
      <Link href={`/reader/${GIFT_BOOK.slug}?preview=1`} className="btn btn-outline" style={{ width: "100%", marginTop: "0.75rem" }}>
        📖 Peek inside first (free preview)
      </Link>
    </div>
  );
}
