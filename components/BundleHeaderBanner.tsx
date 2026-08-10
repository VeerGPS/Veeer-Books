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

export default function BundleHeaderBanner() {
  const router = useRouter();
  const { addMultiple } = useCart();
  const [activeBundle, setActiveBundle] = useState<BundleOffer | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    fetch("/api/bundles")
      .then((res) => res.json())
      .then((data) => {
        if (data.bundles && data.bundles.length > 0) {
          const bundle = data.bundles[0];
          setActiveBundle(bundle);

          // Auto-open modal popup once per session
          try {
            const hasSeen = sessionStorage.getItem(`seen_bundle_${bundle._id}`);
            if (!hasSeen) {
              setIsPopupOpen(true);
            }
          } catch {
            setIsPopupOpen(true);
          }
        }
      })
      .catch(() => setActiveBundle(null));
  }, []);

  if (!activeBundle || isDismissed) return null;

  const savingsINR = Math.max(0, activeBundle.originalPrice - activeBundle.bundlePrice);
  const discountPct = activeBundle.originalPrice > 0 ? Math.round((savingsINR / activeBundle.originalPrice) * 100) : 0;

  const handleClaim = () => {
    addMultiple(activeBundle.bookIds);
    setIsPopupOpen(false);
    try {
      sessionStorage.setItem(`seen_bundle_${activeBundle._id}`, "true");
    } catch {}
    router.push("/cart");
  };

  const handleCloseModal = () => {
    setIsPopupOpen(false);
    try {
      sessionStorage.setItem(`seen_bundle_${activeBundle._id}`, "true");
    } catch {}
  };

  return (
    <>
      {/* ─── Top Header Announcement Bar ─── */}
      <div
        style={{
          backgroundColor: "#1c1917",
          borderBottom: "1px solid #c5a059",
          color: "#fdfbf7",
          padding: "0.45rem 1rem",
          fontSize: "0.85rem",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          position: "relative",
          zIndex: 90,
          fontFamily: "var(--sans)",
        }}
      >
        {/* Desktop Layout */}
        <div className="bundle-banner-desktop-content">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <span
              style={{
                backgroundColor: "#c5a059",
                color: "#1c1917",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {activeBundle.badge || "LIMITED TIME OFFER"}
            </span>

            <span style={{ fontWeight: 600, fontFamily: "var(--serif)", fontSize: "0.9rem", color: "#ffffff" }}>
              {activeBundle.title}
            </span>

            <div style={{ display: "inline-flex", alignItems: "baseline", gap: "0.35rem" }}>
              <span style={{ color: "#fde68a", fontWeight: 700, fontSize: "0.95rem" }}>
                INR {activeBundle.bundlePrice.toFixed(2)}
              </span>
              {activeBundle.originalPrice > activeBundle.bundlePrice ? (
                <span style={{ textDecoration: "line-through", color: "#a8a29e", fontSize: "0.78rem" }}>
                  INR {activeBundle.originalPrice.toFixed(2)}
                </span>
              ) : null}
            </div>

            {discountPct > 0 ? (
              <span
                style={{
                  backgroundColor: "rgba(197, 160, 89, 0.2)",
                  color: "#fde68a",
                  border: "1px solid #c5a059",
                  padding: "1px 7px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                SAVE {discountPct}% (INR {savingsINR.toFixed(2)} OFF)
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsPopupOpen(true)}
              style={{
                background: "transparent",
                color: "#c5a059",
                border: "1px solid #c5a059",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "0.76rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View Offer
            </button>

            <button
              type="button"
              onClick={handleClaim}
              style={{
                backgroundColor: "#c5a059",
                color: "#1c1917",
                border: "none",
                padding: "4px 13px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Claim Offer
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss banner"
              style={{
                background: "none",
                border: "none",
                color: "#a8a29e",
                fontSize: "1.05rem",
                cursor: "pointer",
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="bundle-banner-mobile-content">
          <div
            onClick={() => setIsPopupOpen(true)}
            style={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              cursor: "pointer",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: 700 }}>
              🔥 Bundle Deal:
            </span>
            <span style={{ color: "#fde68a", fontWeight: 700 }}>
              INR {activeBundle.bundlePrice.toFixed(0)}
            </span>
            <span style={{ color: "#c5a059", fontWeight: 600, fontSize: "0.8rem" }}>
              (Save {discountPct}%) ➔
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            style={{
              background: "none",
              border: "none",
              color: "#a8a29e",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0 6px 0 12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ─── Refined Luxury Modal Popup ─── */}
      {isPopupOpen ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(18, 16, 14, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "var(--sans)",
          }}
          onClick={handleCloseModal}
        >
          <div
            className="bundle-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close offer popup"
              style={{
                position: "absolute",
                top: "0.85rem",
                right: "0.85rem",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid #e2ddd3",
                backgroundColor: "#ffffff",
                color: "#5a5a5a",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                zIndex: 10,
              }}
            >
              ✕
            </button>

            {/* Header Badge & Title */}
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#fcf8ef",
                  border: "1px solid #c5a059",
                  color: "#a68546",
                  padding: "3px 12px",
                  borderRadius: "16px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                🔥 {activeBundle.badge || "LIMITED TIME OFFER"} 🔥
              </span>

              <h2
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  fontFamily: "var(--serif)",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {activeBundle.title}
              </h2>
            </div>

            {/* 3D Book Cover Stack */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.85rem", margin: "1rem 0" }}>
              {activeBundle.books.map((b, idx) => (
                <div
                  key={b.id || idx}
                  style={{
                    width: 88,
                    height: 125,
                    position: "relative",
                    borderRadius: "6px",
                    overflow: "hidden",
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.16)",
                    border: "1.5px solid #c5a059",
                    backgroundColor: "#ffffff",
                    transform: `rotate(${idx === 0 ? -4 : idx === 2 ? 4 : 0}deg)`,
                    flexShrink: 0,
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

            {/* Included Titles Checklist */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                border: "1px solid #e2ddd3",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#5a5a5a", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
                Included eBooks ({activeBundle.books.length}):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {activeBundle.books.map((b) => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#1a1a1a" }}>
                    <span style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ color: "#c5a059", fontSize: "0.85rem" }}>✦</span>
                      {b.title}
                    </span>
                    <span style={{ color: "#8c857b", fontSize: "0.8rem", textDecoration: "line-through" }}>
                      INR {(b.sellingPrice || b.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Charcoal Pricing Box */}
            <div
              style={{
                backgroundColor: "#1c1917",
                borderRadius: "12px",
                border: "1px solid #c5a059",
                padding: "1rem 1.25rem",
                color: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.85rem" }}>
                <div>
                  <span style={{ fontSize: "0.68rem", color: "#c5a059", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                    SPECIAL BUNDLE PRICE
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginTop: "0.2rem" }}>
                    <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", fontFamily: "var(--sans)" }}>
                      INR {activeBundle.bundlePrice.toFixed(2)}
                    </span>
                    {activeBundle.originalPrice > activeBundle.bundlePrice ? (
                      <span style={{ fontSize: "0.9rem", color: "#a8a29e", textDecoration: "line-through" }}>
                        INR {activeBundle.originalPrice.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {discountPct > 0 ? (
                  <span
                    style={{
                      backgroundColor: "#c5a059",
                      color: "#1c1917",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    SAVE {discountPct}%
                  </span>
                ) : null}
              </div>

              {/* Clean Luxury CTA Button */}
              <button
                type="button"
                onClick={handleClaim}
                style={{
                  width: "100%",
                  backgroundColor: "#c5a059",
                  color: "#1c1917",
                  border: "none",
                  padding: "0.85rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  fontFamily: "var(--sans)",
                  letterSpacing: "0.3px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(197, 160, 89, 0.35)",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                }}
              >
                Claim Offer — INR {activeBundle.bundlePrice.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
