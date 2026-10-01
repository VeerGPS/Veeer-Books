"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EMAIL_RE, GIFT_BOOK } from "@/lib/gift";
import { getRefCode } from "@/lib/referral-client";
import { trackMarketplaceEvent } from "@/lib/analytics";
import { Money } from "@/components/Price";

export const GIFT_CLAIMED_KEY = "vsb_gift_claimed";

export function markGiftClaimed() {
  try { localStorage.setItem(GIFT_CLAIMED_KEY, String(Date.now())); } catch { /* ignore */ }
}

/**
 * Email sign-up that unlocks The Shattered Sky instantly.
 * variant "card" = big panel with cover, "inline" = compact footer form.
 */
export default function GiftSignup({ variant = "card", source = "site", onDone }: { variant?: "card" | "inline" | "modal" | "product"; source?: string; onDone?: () => void }) {
  const { token, addPurchasedBooks } = useAuth();
  const [email, setEmail] = useState("");
    const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!EMAIL_RE.test(email.trim())) return setErr("Please enter a valid email address.");
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: email.trim(), source, website: trap, refCode: getRefCode() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
      addPurchasedBooks([GIFT_BOOK.id]);
      markGiftClaimed();
      trackMarketplaceEvent("free_gift_claimed");
      setDone(true);
      onDone?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={`gift gift-${variant} gift-done`}>
        <div className="gift-done-inner">
          <div className="gift-emoji" aria-hidden="true">🎁</div>
          <h3>{GIFT_BOOK.title} is yours!</h3>
          <p>We’ve also emailed you a link so you can read it on any device.</p>
          <Link href={`/reader/${GIFT_BOOK.slug}`} className="btn btn-primary">Start reading now</Link>
        </div>
      </div>
    );
  }

  const form = (
    <form onSubmit={submit} className="gift-form" noValidate>
      <input className="gift-input" type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-label="Email address" required />
      <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} className="gift-trap" aria-hidden="true" />
      <button className="btn btn-primary gift-btn" disabled={busy}>{busy ? "Sending…" : "Get the free book"}</button>
      {err ? <p className="gift-err" role="alert">{err}</p> : null}
      <p className="gift-fine">No spam. Just new books, launch offers and the odd reading tip. Unsubscribe any time.</p>
    </form>
  );

  if (variant === "product") {
    return (
      <div className="gift gift-product">
        <div className="gift-product-label">Free for you today</div>
        <div className="gift-product-price"><b>FREE</b> <s><Money inr={GIFT_BOOK.price} /></s></div>
        <p>Enter your email and the complete book is yours instantly — no payment, no card.</p>
        {form}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="gift gift-inline">
        <h4>Get a free book</h4>
        <p>Join our reading list and get <b>{GIFT_BOOK.title}</b> — the full book, free.</p>
        {form}
      </div>
    );
  }

  return (
    <div className={`gift gift-${variant}`}>
      <div className="gift-cover">
        <Image src={GIFT_BOOK.cover} alt={`${GIFT_BOOK.title} cover`} width={180} height={270} sizes="180px" />
      </div>
      <div className="gift-body">
        <span className="gift-badge">Free gift · worth <Money inr={GIFT_BOOK.price} /></span>
        <h3>Read <i>{GIFT_BOOK.title}</i> free — the complete book</h3>
        <p>{GIFT_BOOK.pitch} Join our reading list and it’s yours instantly, on any device.</p>
        {form}
      </div>
    </div>
  );
}
