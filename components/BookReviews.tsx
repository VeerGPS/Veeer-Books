"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import type { PublicReview, ReviewSummary } from "@/lib/reviews";
import { trackMarketplaceEvent } from "@/lib/analytics";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={value >= i - 0.25 ? "on" : value >= i - 0.75 ? "half" : ""} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export default function BookReviews({ bookId, bookTitle, initialSummary, initialReviews }: { bookId: number; bookTitle: string; initialSummary: ReviewSummary; initialReviews: PublicReview[] }) {
  const { isLoggedIn, purchasedBooks, token } = useAuth();
  const { show } = useModal();
  const [summary, setSummary] = useState(initialSummary);
  const [reviews, setReviews] = useState(initialReviews);
  const [mine, setMine] = useState<{ rating: number; title?: string; body: string; status: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const owns = purchasedBooks.includes(bookId);
  const [wantsToReview, setWantsToReview] = useState(false);
  // After signing in from the "Rate & review" button, open the form straight away.
  useEffect(() => { if (isLoggedIn && wantsToReview) { setOpen(true); setWantsToReview(false); } }, [isLoggedIn, wantsToReview]);

  const refresh = () =>
    fetch(`/api/reviews?bookId=${bookId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((j) => {
        if (j.summary) setSummary(j.summary);
        if (j.reviews) setReviews(j.reviews);
        setMine(j.mine || null);
        if (j.mine) { setRating(j.mine.rating); setTitle(j.mine.title || ""); setBody(j.mine.body || ""); }
      })
      .catch(() => {});

  useEffect(() => { if (token) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token, bookId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!rating) return setMsg("Please choose a star rating.");
    if (body.trim().length < 10) return setMsg("Please write at least a sentence.");
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId, rating, title, body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save your review");
      trackMarketplaceEvent("review_submitted");
      setOpen(false);
      setMsg("");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save your review");
    } finally {
      setBusy(false);
    }
  };

  const max = Math.max(1, ...summary.breakdown);

  return (
    <section className="reviews" id="reviews" aria-labelledby="reviews-h">
      <div className="reviews-head">
        <h2 id="reviews-h">Ratings &amp; reviews</h2>
        {isLoggedIn ? (
          <button className="btn btn-primary btn-sm" onClick={() => setOpen((v) => !v)}>{mine ? "Edit your review" : "★ Write a review"}</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => { setWantsToReview(true); show("login"); }}>★ Rate &amp; review</button>
        )}
      </div>

      {summary.count > 0 ? (
        <div className="reviews-summary">
          <div className="reviews-score">
            <b>{summary.average.toFixed(1)}</b>
            <Stars value={summary.average} size={20} />
            <span>{summary.count} review{summary.count === 1 ? "" : "s"}</span>
          </div>
          <div className="reviews-bars">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="reviews-bar">
                <span>{n}★</span>
                <div><i style={{ width: `${(summary.breakdown[n - 1] / max) * 100}%` }} /></div>
                <span>{summary.breakdown[n - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">No reviews yet — be the first to rate <b>{bookTitle}</b>!</p>
      )}

      {open ? (
        <form className="review-form" onSubmit={submit}>
          <div className="review-stars-input" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button type="button" key={i} role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`}
                className={(hover || rating) >= i ? "on" : ""} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}>★</button>
            ))}
          </div>
          <input className="gift-input" placeholder="Headline (optional)" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="gift-input review-body" placeholder="What did you like? Who would you recommend it to?" value={body} maxLength={3000} rows={4} onChange={(e) => setBody(e.target.value)} />
          {msg ? <p className="gift-err">{msg}</p> : null}
          {!owns ? <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>Readers who buy the book get a ✓ Verified reader badge on their review.</p> : null}
          <div style={{ display: "flex", gap: ".5rem" }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : mine ? "Update review" : "Post review"}</button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          {mine?.status === "hidden" ? <p className="muted" style={{ fontSize: ".85rem" }}>Your review is currently hidden by a moderator.</p> : null}
        </form>
      ) : null}

      <ul className="review-list">
        {reviews.map((r) => (
          <li key={r.id}>
            <div className="review-top">
              <Stars value={r.rating} />
              {r.title ? <b>{r.title}</b> : null}
            </div>
            <p>{r.body}</p>
            <div className="review-meta">
              {r.name} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
              {r.verified ? <span className="review-verified">✓ Verified reader</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
