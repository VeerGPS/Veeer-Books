"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const handleCloseModal = useCallback(() => {
    setIsPopupOpen(false);
    if (activeBundle) {
      try {
        sessionStorage.setItem(`seen_bundle_${activeBundle._id}`, "true");
      } catch {}
    }
  }, [activeBundle]);

  useEffect(() => {
    if (!isPopupOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isPopupOpen, handleCloseModal]);

  if (!activeBundle || isDismissed) return null;

  const savingsINR = Math.max(0, activeBundle.originalPrice - activeBundle.bundlePrice);
  const discountPct =
    activeBundle.originalPrice > 0
      ? Math.round((savingsINR / activeBundle.originalPrice) * 100)
      : 0;

  const handleClaim = () => {
    addMultiple(activeBundle.bookIds);
    handleCloseModal();
    router.push("/cart");
  };

  const modalElement =
    mounted && isPopupOpen ? (
      <div
        className="bundle-modal-backdrop"
        onClick={handleCloseModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bundle-modal-title"
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
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid #dcd6c8",
              backgroundColor: "#ffffff",
              color: "#44403c",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 20,
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f0e6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            ✕
          </button>

          {/* Header Badge & Title */}
          <div style={{ textAlign: "center", marginBottom: "0.85rem", paddingRight: "1.5rem", paddingLeft: "1.5rem" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#fef3c7",
                border: "1px solid #c5a059",
                color: "#92400e",
                padding: "3px 12px",
                borderRadius: "16px",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                marginBottom: "0.45rem",
              }}
            >
              {activeBundle.badge || "🔥 LIMITED TIME OFFER"}
            </span>

            <h2
              id="bundle-modal-title"
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#1c1917",
                fontFamily: "var(--serif)",
                margin: "0 0 0.35rem 0",
                lineHeight: 1.25,
              }}
            >
              {activeBundle.title}
            </h2>

            {activeBundle.description ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#57534e", lineHeight: 1.4 }}>
                {activeBundle.description}
              </p>
            ) : null}
          </div>

          {/* 3D Book Cover Showcase Stack */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.6rem",
              margin: "0.85rem 0 1rem",
              padding: "0.25rem 0",
            }}
          >
            {(activeBundle.books || []).slice(0, 3).map((b, idx) => (
              <div
                key={b.id || idx}
                style={{
                  width: 78,
                  height: 112,
                  position: "relative",
                  borderRadius: "6px",
                  overflow: "hidden",
                  boxShadow: "0 8px 18px rgba(0, 0, 0, 0.18)",
                  border: "1.5px solid #c5a059",
                  backgroundColor: "#ffffff",
                  transform: `rotate(${idx === 0 ? -4 : idx === 2 ? 4 : 0}deg)`,
                  transition: "transform 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={b.cover ? encodeURI(b.cover) : "/images/default-book.svg"}
                  alt={b.title}
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ))}
            {(activeBundle.books || []).length > 3 ? (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#c5a059",
                  color: "#1c1917",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}
              >
                +{activeBundle.books.length - 3}
              </div>
            ) : null}
          </div>

          {/* Included Titles Checklist */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "0.75rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #e7e2d7",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "#78716c",
                textTransform: "uppercase",
                fontWeight: 800,
                letterSpacing: "0.5px",
                marginBottom: "0.4rem",
              }}
            >
              Included In This Collection ({(activeBundle.books || []).length} eBooks):
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                maxHeight: 130,
                overflowY: "auto",
              }}
            >
              {(activeBundle.books || []).map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.84rem",
                    color: "#292524",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={b.title}
                  >
                    <span style={{ color: "#c5a059", fontSize: "0.85rem", flexShrink: 0 }}>✦</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.title}
                    </span>
                  </span>
                  <span
                    style={{
                      color: "#a8a29e",
                      fontSize: "0.78rem",
                      textDecoration: "line-through",
                      flexShrink: 0,
                      fontWeight: 500,
                    }}
                  >
                    INR {(b.sellingPrice ?? b.price ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Luxury Charcoal & Gold Pricing Card */}
          <div
            style={{
              backgroundColor: "#1c1917",
              borderRadius: "12px",
              border: "1.5px solid #c5a059",
              padding: "0.95rem 1.15rem",
              color: "#ffffff",
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "#c5a059",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: "0.6px",
                    display: "block",
                  }}
                >
                  SPECIAL BUNDLE PRICE
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.15rem" }}>
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "#fef3c7",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    INR {activeBundle.bundlePrice.toFixed(2)}
                  </span>
                  {activeBundle.originalPrice > activeBundle.bundlePrice ? (
                    <span style={{ fontSize: "0.88rem", color: "#a8a29e", textDecoration: "line-through" }}>
                      INR {activeBundle.originalPrice.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </div>

              {discountPct > 0 ? (
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      backgroundColor: "#c5a059",
                      color: "#1c1917",
                      padding: "3px 9px",
                      borderRadius: "12px",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      display: "inline-block",
                    }}
                  >
                    SAVE {discountPct}%
                  </span>
                  <div style={{ fontSize: "0.72rem", color: "#fef08a", marginTop: "2px", fontWeight: 600 }}>
                    Save INR {savingsINR.toFixed(2)}
                  </div>
                </div>
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
                padding: "0.8rem 1rem",
                fontSize: "0.98rem",
                fontWeight: 800,
                fontFamily: "var(--sans)",
                letterSpacing: "0.3px",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(197, 160, 89, 0.4)",
                transition: "all 0.2s ease",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#d4af37";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#c5a059";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>🎁</span>
              <span>Claim Bundle — INR {activeBundle.bundlePrice.toFixed(2)}</span>
            </button>
          </div>

          {/* Browse all bundles footer link */}
          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <Link
              href="/bundles"
              onClick={handleCloseModal}
              style={{
                fontSize: "0.78rem",
                color: "#78716c",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              View all available multi-book bundles ➔
            </Link>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      {/* ─── Top Header Announcement Bar ─── */}
      <div
        style={{
          backgroundColor: "#1c1917",
          borderBottom: "1px solid #c5a059",
          color: "#fdfbf7",
          padding: "0.4rem 1rem",
          fontSize: "0.85rem",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.25)",
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
                fontWeight: 800,
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

      {/* Render Modal via Portal directly to body */}
      {mounted && modalElement ? createPortal(modalElement, document.body) : null}
    </>
  );
}
