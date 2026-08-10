"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

type BookItem = {
  id: number;
  slug: string;
  title: string;
  author: string;
  cover: string;
  price: number;
  sellingPrice?: number;
};

type BundleOffer = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  bookIds: number[];
  originalPrice: number;
  bundlePrice: number;
  badge: string;
  isActive: boolean;
  books: BookItem[];
};

export default function BundlesPage() {
  const router = useRouter();
  const { addMultiple } = useCart();
  const [bundles, setBundles] = useState<BundleOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bundles")
      .then((res) => res.json())
      .then((data) => {
        setBundles(data.bundles || []);
        setLoading(false);
      })
      .catch(() => {
        setBundles([]);
        setLoading(false);
      });
  }, []);

  const handleClaimBundle = (bookIds: number[]) => {
    addMultiple(bookIds);
    router.push("/cart");
  };

  return (
    <main style={{ padding: "5rem 1rem 4rem", backgroundColor: "#f8fafc", minHeight: "90vh" }}>
      <div className="container" style={{ maxWidth: 1060, margin: "0 auto" }}>
        
        {/* Header Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: "20px", backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1rem" }}>
            🔥 Limited Time Value Packs
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", fontFamily: "var(--serif)" }}>
            Special eBook Bundle Offers
          </h1>
          <p style={{ color: "#475569", fontSize: "1.1rem", maxWidth: 640, margin: "0 auto" }}>
            Get hand-picked multi-book collections at an exclusive discounted bundle price. Complete story sets and master learning paths.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#475569" }}>
            <p style={{ fontSize: "1.1rem" }}>Loading exclusive bundle offers...</p>
          </div>
        ) : null}

        {!loading && bundles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 2rem", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>No Active Bundles Today</h2>
            <p style={{ color: "#475569", marginBottom: "1.5rem" }}>Check back soon for new multi-book discount bundles!</p>
            <Link href="/" className="btn btn-primary">
              Browse Individual eBooks
            </Link>
          </div>
        ) : null}

        {/* Bundle Offers List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {bundles.map((bundle) => {
            const savingsINR = Math.max(0, bundle.originalPrice - bundle.bundlePrice);
            const discountPct = bundle.originalPrice > 0 ? Math.round((savingsINR / bundle.originalPrice) * 100) : 0;

            return (
              <div
                key={bundle._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "2rem",
                  padding: "2.25rem",
                  borderRadius: "20px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #e2e8f0",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Book Covers Stack Collage */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 220 }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {bundle.books.map((b, i) => (
                      <div
                        key={b.id || i}
                        style={{
                          width: 100,
                          height: 145,
                          position: "relative",
                          borderRadius: "8px",
                          overflow: "hidden",
                          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                          border: "2px solid #ffffff",
                          transform: `rotate(${(i % 2 === 0 ? -4 : 4) * (i + 1)}deg)`,
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <Image
                          src={b.cover || "/images/default-book.svg"}
                          alt={b.title}
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bundle Details & Actions */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      <span style={{ padding: "4px 12px", borderRadius: "12px", backgroundColor: "#dc2626", color: "#ffffff", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {bundle.badge || "🔥 LIMITED TIME OFFER"}
                      </span>
                      {discountPct > 0 ? (
                        <span style={{ padding: "4px 12px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 800 }}>
                          SAVE {discountPct}% (₹{savingsINR} OFF)
                        </span>
                      ) : null}
                    </div>

                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem", fontFamily: "var(--serif)" }}>
                      {bundle.title}
                    </h2>
                    <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                      {bundle.description || `Includes ${bundle.books.length} full digital eBooks in one collection.`}
                    </p>

                    {/* Included Books Pill List */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "0.5rem" }}>
                        Included eBooks ({bundle.books.length}):
                      </strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {bundle.books.map((b) => (
                          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#334155" }}>
                            <span style={{ color: "#15803d", fontWeight: 800 }}>✓</span>
                            <span>{b.title}</span>
                            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>(₹{b.sellingPrice || b.price})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div style={{ paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 600 }}>Bundle Price</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
                        <span style={{ fontSize: "2rem", fontWeight: 800, color: "#4f46e5" }}>₹{bundle.bundlePrice}</span>
                        {bundle.originalPrice > bundle.bundlePrice ? (
                          <span style={{ fontSize: "1.1rem", color: "#94a3b8", textDecoration: "line-through" }}>₹{bundle.originalPrice}</span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => handleClaimBundle(bundle.bookIds)}
                      style={{ padding: "0.85rem 1.75rem", fontSize: "1.05rem", fontWeight: 700, borderRadius: "10px", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)" }}
                    >
                      🎁 Claim Bundle Offer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
