"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function ProductActions({ bookId, slug }: { bookId: number; slug: string }) {
  const router = useRouter();
  const { add, hasItem } = useCart();

  const handleBuyNow = () => {
    if (!hasItem(bookId)) {
      add(bookId);
    }
    router.push("/cart");
  };

  const handleAddToCart = () => {
    if (!hasItem(bookId)) {
      add(bookId);
    }
    router.push("/cart");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "1.5rem" }}>
      <div className="product-actions-grid">
        {/* Primary BUY NOW Button */}
        <button
          className="btn btn-primary"
          type="button"
          onClick={handleBuyNow}
          style={{
            padding: "0.85rem 1.5rem",
            fontSize: "1.05rem",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(197, 160, 89, 0.4)",
            textAlign: "center",
            width: "100%",
          }}
        >
          ⚡ BUY NOW (Instant Access)
        </button>

        {/* Secondary ADD TO CART Button */}
        <button
          className="btn btn-outline"
          type="button"
          onClick={handleAddToCart}
          style={{
            padding: "0.85rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1a1a1a",
            borderColor: "#c5a059",
            backgroundColor: "#ffffff",
            width: "100%",
          }}
        >
          {hasItem(bookId) ? "✓ In Cart" : "🛒 Add to Cart"}
        </button>
      </div>

      {/* READ FREE PREVIEW Direct Navigation Button */}
      <Link
        href={`/reader/${slug}?preview=true`}
        className="btn btn-outline"
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#8c7647",
          borderColor: "#e2ddd3",
          backgroundColor: "#faf8f5",
          textAlign: "center",
          display: "inline-block",
        }}
      >
        📖 READ FREE PREVIEW (Sample Pages)
      </Link>
    </div>
  );
}
