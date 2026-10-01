"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GIFT_BOOK } from "@/lib/gift";
import { GIFT_CLAIMED_KEY } from "@/components/GiftSignup";

/** Small "free book" banner on book pages, for visitors who haven't claimed it yet. */
export default function FreeBookStrip({ currentSlug }: { currentSlug: string }) {
  const { purchasedBooks, isReady } = useAuth();
  const [claimed, setClaimed] = useState(true);
  useEffect(() => {
    try { setClaimed(Boolean(localStorage.getItem(GIFT_CLAIMED_KEY))); } catch { setClaimed(false); }
  }, []);

  if (!isReady || claimed || purchasedBooks.includes(GIFT_BOOK.id)) return null;
  const isGiftBook = currentSlug === GIFT_BOOK.slug;

  return (
    <Link href="/free-book" className="freestrip">
      <Image src={GIFT_BOOK.cover} alt="" width={44} height={66} sizes="44px" />
      <span className="freestrip-text">
        <b>{isGiftBook ? "This book is free for you" : "Not sure yet? Start with a free book"}</b>
        <span>{isGiftBook ? `Get the full ${GIFT_BOOK.title} free — just enter your email.` : `Read ${GIFT_BOOK.title} — the complete book, free.`}</span>
      </span>
      <span className="freestrip-cta">Get it free →</span>
    </Link>
  );
}
