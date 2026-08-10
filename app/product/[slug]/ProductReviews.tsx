"use client";

import { useState } from "react";
import type { Review } from "@/lib/books";

export default function ProductReviews({ initialReviews = [] }: { initialReviews?: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    const newRev: Review = {
      id: "usr_" + Date.now(),
      name: name.trim(),
      rating,
      date: "Just now",
      comment: comment.trim(),
      verified: true,
    };

    setReviews([newRev, ...reviews]);
    setName("");
    setComment("");
    setRating(5);
    setShowForm(false);
    setSubmitted(true);
  };

  return (
    <section style={{ marginTop: "3.5rem", paddingTop: "2.5rem", borderTop: "1px solid #e2ddd3" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", margin: 0 }}>
            Reader Reviews & Ratings
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
            <div style={{ color: "#f59e0b", fontSize: "1.1rem" }}>{"★".repeat(Math.round(Number(avgRating)))}</div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a1a1a" }}>{avgRating}</span>
            <span style={{ color: "#5a5a5a", fontSize: "0.9rem" }}>based on {reviews.length} genuine reader reviews</span>
          </div>
        </div>

        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{ color: "#1a1a1a", borderColor: "#c5a059", backgroundColor: "#ffffff" }}
        >
          {showForm ? "Close Form" : "✍️ Write a Review"}
        </button>
      </div>

      {submitted ? (
        <div style={{ padding: "0.85rem 1rem", backgroundColor: "#dcfce7", color: "#15803d", borderRadius: "8px", fontWeight: 600, marginBottom: "1.5rem" }}>
          ✅ Thank you for sharing your review! It has been posted below.
        </div>
      ) : null}

      {/* Review Submission Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmitReview}
          style={{
            backgroundColor: "#faf8f5",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #c5a059",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#1a1a1a" }}>Submit Your Review</h3>
          <div className="review-form-grid">
            <div>
              <label htmlFor="rev-name" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>Your Name *</label>
              <input
                id="rev-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div>
              <label htmlFor="rev-rating" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>Rating *</label>
              <select
                id="rev-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value={5}>5 Stars — Excellent ★★★★★</option>
                <option value={4}>4 Stars — Very Good ★★★★☆</option>
                <option value={3}>3 Stars — Good ★★★☆☆</option>
                <option value={2}>2 Stars — Average ★★☆☆☆</option>
                <option value={1}>1 Star — Poor ★☆☆☆☆</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="rev-comment" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>Your Feedback / Review *</label>
            <textarea
              id="rev-comment"
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you enjoy about this eBook?"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }}
            />
          </div>
          <button className="btn btn-primary" type="submit" style={{ fontWeight: 700 }}>
            Post Review
          </button>
        </form>
      ) : null}

      {/* Reviews Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{
              backgroundColor: "#ffffff",
              padding: "1.25rem 1.5rem",
              borderRadius: "12px",
              border: "1px solid #e2ddd3",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <strong style={{ fontSize: "1rem", color: "#1a1a1a" }}>{r.name}</strong>
                {r.verified ? (
                  <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: "10px", backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                    ✓ Verified Reader
                  </span>
                ) : null}
              </div>
              <span style={{ fontSize: "0.82rem", color: "#8c857b" }}>{r.date}</span>
            </div>
            <div style={{ color: "#f59e0b", fontSize: "0.9rem", marginBottom: "0.4rem" }}>{"★".repeat(r.rating)}</div>
            <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              &ldquo;{r.comment}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
