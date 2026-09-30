"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BookPrice, bundleMoney } from "@/components/Price";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { canOptimize } from "@/lib/image";

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
  const cur = useCurrency();
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
    <main style={{ padding: "4rem 1rem 5rem", backgroundColor: "var(--bg-paper, #fdfbf7)", minHeight: "90vh" }}>
      <div className="container" style={{ maxWidth: 1040, margin: "0 auto" }}>
        
        {/* Header Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "5px 16px",
              borderRadius: "20px",
              backgroundColor: "#fef3c7",
              border: "1px solid #c5a059",
              color: "#92400e",
              fontSize: "0.82rem",
              fontWeight: 800,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            🔥 Exclusive Multi-Book Value Packs
          </span>
          <h1
            style={{
              fontSize: "2.6rem",
              fontWeight: 800,
              color: "#1c1917",
              marginBottom: "0.75rem",
              fontFamily: "var(--serif)",
              lineHeight: 1.2,
            }}
          >
            Special eBook Bundle Offers
          </h1>
          <p style={{ color: "#57534e", fontSize: "1.05rem", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Curated story collections and master learning bundles at an exclusive discounted price. One click unlocks the full series with instant browser reading access.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#78716c" }}>
            <p style={{ fontSize: "1.1rem" }}>Loading exclusive bundle collections...</p>
          </div>
        ) : null}

        {!loading && bundles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3.5rem 2rem",
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e7e2d7",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", marginBottom: "0.5rem" }}>
              No Active Bundles Today
            </h2>
            <p style={{ color: "#78716c", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Check back soon for upcoming multi-book discount packages and limited-time collections!
            </p>
            <Link href="/" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
              Browse Individual eBooks
            </Link>
          </div>
        ) : null}

        {/* Bundle Offers List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {bundles.map((bundle) => {
            const m = bundleMoney(cur, bundle);
            const savingsINR = m.savings;
            const discountPct =
              m.original > 0
                ? m.pct
                : 0;

            return (
              <div
                key={bundle._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
                  gap: "2.25rem",
                  padding: "2.25rem",
                  borderRadius: "20px",
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #e7e2d7",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Book Covers Stack Showcase */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    minHeight: 220,
                    backgroundColor: "#fcfaf6",
                    borderRadius: "14px",
                    border: "1px solid #f0eae0",
                    padding: "1.5rem 1rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                    {(bundle.books || []).map((b, i) => (
                      <div
                        key={b.id || i}
                        style={{
                          width: 96,
                          height: 140,
                          position: "relative",
                          borderRadius: "8px",
                          overflow: "hidden",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                          border: "1.5px solid #c5a059",
                          backgroundColor: "#ffffff",
                          transform: `rotate(${(i % 2 === 0 ? -3 : 3) * (i + 1)}deg)`,
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <Image
                          src={b.cover ? encodeURI(b.cover) : "/images/default-book.svg"}
                          alt={b.title}
                          fill
                          sizes="100px"
                          style={{ objectFit: "cover" }}
                          unoptimized={!canOptimize(b.cover)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bundle Details & Actions */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          backgroundColor: "#fef3c7",
                          border: "1px solid #c5a059",
                          color: "#92400e",
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {bundle.badge || "🔥 LIMITED TIME OFFER"}
                      </span>
                      {discountPct > 0 ? (
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            backgroundColor: "#dcfce7",
                            color: "#15803d",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                          }}
                        >
                          SAVE {discountPct}% ({cur.fmt(savingsINR)} OFF)
                        </span>
                      ) : null}
                    </div>

                    <h2
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#1c1917",
                        marginBottom: "0.5rem",
                        fontFamily: "var(--serif)",
                      }}
                    >
                      {bundle.title}
                    </h2>
                    <p style={{ color: "#57534e", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                      {bundle.description || `Includes ${(bundle.books || []).length} full digital eBooks in one collection.`}
                    </p>

                    {/* Included Books List */}
                    <div
                      style={{
                        backgroundColor: "#fcfaf6",
                        padding: "0.85rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid #f0eae0",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "0.78rem",
                          color: "#78716c",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          display: "block",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Included eBooks ({(bundle.books || []).length}):
                      </strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {(bundle.books || []).map((b) => (
                          <div
                            key={b.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.88rem",
                              color: "#292524",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
                              <span style={{ color: "#c5a059" }}>✦</span>
                              {b.title}
                            </span>
                            <span style={{ color: "#a8a29e", fontSize: "0.8rem", textDecoration: "line-through" }}>
                              <BookPrice book={{ ...b, price: b.price ?? b.sellingPrice ?? 0 }} strike={false} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Bar */}
                  <div
                    style={{
                      paddingTop: "1.25rem",
                      borderTop: "1px solid #f0eae0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#78716c", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                        Bundle Special Price
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
                        <span style={{ fontSize: "1.85rem", fontWeight: 800, color: "#1c1917", fontFamily: "var(--sans)" }}>
                          {cur.fmt(m.price)}
                        </span>
                        {m.original > m.price ? (
                          <span style={{ fontSize: "1rem", color: "#a8a29e", textDecoration: "line-through" }}>
                            {cur.fmt(m.original)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => handleClaimBundle(bundle.bookIds)}
                      style={{
                        padding: "0.85rem 1.6rem",
                        fontSize: "1rem",
                        fontWeight: 700,
                        borderRadius: "8px",
                        boxShadow: "0 4px 14px rgba(197, 160, 89, 0.35)",
                        backgroundColor: "#c5a059",
                        color: "#1c1917",
                        border: "none",
                        cursor: "pointer",
                      }}
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
