"use client";

import { useRef, useState } from "react";
import Link from "next/link";

interface PreviewIframeProps {
  readerSrc: string;
  title: string;
  isPreview: boolean;
  bookSlug: string;
  bookPrice: number;
}

export default function PreviewIframeContainer({
  readerSrc,
  title,
  isPreview,
  bookSlug,
  bookPrice,
}: PreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showModal, setShowModal] = useState(false);

  const handleIframeLoad = () => {
    if (!isPreview || !iframeRef.current) return;

    try {
      const win = iframeRef.current.contentWindow as any;
      if (!win) return;

      let curPageTracked = 1;

      const getCurPage = () => {
        if (typeof win.curPage === "number") return win.curPage;
        if (typeof win.cur === "number") return win.cur;
        return curPageTracked;
      };

      // Intercept goTo function inside the iframe
      if (typeof win.goTo === "function") {
        const originalGoTo = win.goTo;
        win.goTo = function (n: number) {
          if (n > 8) {
            setShowModal(true);
            return;
          }
          curPageTracked = n;
          originalGoTo(n);
        };
      }

      // Intercept next function if present
      if (typeof win.next === "function") {
        const originalNext = win.next;
        win.next = function () {
          if (getCurPage() >= 8) {
            setShowModal(true);
            return;
          }
          originalNext();
        };
      }

      // Intercept ArrowRight / PageDown keydown events inside the iframe
      win.addEventListener(
        "keydown",
        (e: KeyboardEvent) => {
          if (e.key === "ArrowRight" || e.key === "PageDown") {
            if (getCurPage() >= 8) {
              e.stopImmediatePropagation();
              e.preventDefault();
              setShowModal(true);
            }
          }
        },
        true
      );
    } catch (err) {
      console.warn("Could not attach preview listener to iframe:", err);
    }
  };

  const iframeSrc = isPreview
    ? `${readerSrc}${readerSrc.includes("?") ? "&" : "?"}preview=1`
    : readerSrc;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", backgroundColor: "#0f172a" }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={title}
        onLoad={handleIframeLoad}
        style={{ width: "100%", height: "100%", border: "none" }}
      />

      {/* 8-Page Preview Complete Modal Overlay */}
      {showModal ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(12, 10, 8, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            fontFamily: "var(--sans)",
          }}
        >
          <div
            style={{
              backgroundColor: "#faf8f5",
              backgroundImage: "radial-gradient(circle at 50% 0%, #ffffff 0%, #f7f3ea 70%, #ece5d6 100%)",
              borderRadius: "22px",
              border: "2px solid #c5a059",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5), 0 0 35px rgba(197, 160, 89, 0.25)",
              maxWidth: 460,
              width: "100%",
              padding: "2.25rem 2rem",
              textAlign: "center",
              color: "#1a1a1a",
              animation: "popupSpring 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div style={{ fontSize: "2.2rem", marginBottom: "0.4rem" }}>📖</div>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#fef3c7",
                border: "1px solid #c5a059",
                color: "#b45309",
                padding: "3px 12px",
                borderRadius: "16px",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              FREE PREVIEW COMPLETE (8 PAGES)
            </span>

            <h3
              style={{
                fontSize: "1.55rem",
                fontWeight: 800,
                color: "#1a1a1a",
                fontFamily: "var(--serif)",
                margin: "0 0 0.5rem 0",
                lineHeight: 1.25,
              }}
            >
              Enjoying the Story?
            </h3>
            <p style={{ color: "#5a5a5a", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              You have reached the end of the 8-page free preview for <strong>{title}</strong>. Unlock the complete full eBook for instant lifetime reading access.
            </p>

            <Link
              href={`/product/${bookSlug}`}
              className="btn btn-primary"
              style={{
                display: "block",
                width: "100%",
                padding: "0.9rem",
                fontSize: "1.05rem",
                fontWeight: 800,
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(197, 160, 89, 0.4)",
              }}
            >
              🎁 Unlock Full eBook (INR {bookPrice.toFixed(2)})
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                if (iframeRef.current?.contentWindow) {
                  (iframeRef.current.contentWindow as any).goTo?.(8);
                }
              }}
              style={{
                background: "none",
                border: "none",
                color: "#8c7647",
                fontSize: "0.85rem",
                marginTop: "1rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Back to Page 8
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
