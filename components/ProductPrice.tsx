"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import type { ForeignOverride } from "@/lib/currency";

/** Big price on the product page: price, crossed-out price and "SAVE x%" in the visitor's currency. */
export default function ProductPrice({ book }: { book: { price: number; actualPrice?: number; regularPrice?: number; foreign?: ForeignOverride } }) {
  const { bookPrice, fmt, ready } = useCurrency();
  const p = bookPrice(book);
  const save = p.actual ? p.actual - p.price : 0;
  const pct = p.actual ? Math.round((save / p.actual) * 100) : 0;
  return (
    <div className={`px${ready ? "" : " px-pending"}`} style={{ display: "flex", alignItems: "baseline", gap: "0.4rem 0.75rem", marginTop: "0.25rem", flexWrap: "wrap", whiteSpace: "nowrap" }}>
      <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)" }}>{fmt(p.price)}</span>
      {p.actual ? <span style={{ fontSize: "1.2rem", color: "#94a3b8", textDecoration: "line-through" }}>{fmt(p.actual)}</span> : null}
      {pct > 0 ? (
        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 800 }}>
          SAVE {pct}% ({fmt(save)} OFF)
        </span>
      ) : null}
    </div>
  );
}
