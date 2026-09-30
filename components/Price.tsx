"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { bundlePriceIn, type ForeignOverride } from "@/lib/currency";

type B = { price: number; actualPrice?: number; regularPrice?: number; foreign?: ForeignOverride };

/** Book price in the visitor's currency (₹ / $ / £), with the crossed-out price if any. */
export function BookPrice({ book, strike = true, strikeClass, className }: { book: B; strike?: boolean; strikeClass?: string; className?: string }) {
  const { bookPrice, fmt, ready } = useCurrency();
  const p = bookPrice(book);
  return (
    <span className={`px${ready ? "" : " px-pending"}${className ? " " + className : ""}`}>
      {fmt(p.price)}
      {strike && p.actual ? <s className={strikeClass}>{fmt(p.actual)}</s> : null}
    </span>
  );
}

/** Just the current price as text (for buttons). */
export function BookPriceText({ book }: { book: B }) {
  const { bookPrice, fmt, ready } = useCurrency();
  return <span className={`px${ready ? "" : " px-pending"}`}>{fmt(bookPrice(book).price)}</span>;
}

/** Any INR amount converted to the visitor's currency (e.g. bundle prices). */
export function Money({ inr, className }: { inr: number; className?: string }) {
  const { fromInr, fmt, ready } = useCurrency();
  return <span className={`px${ready ? "" : " px-pending"}${className ? " " + className : ""}`}>{fmt(fromInr(inr))}</span>;
}

type BundleLike = { bundlePrice: number; originalPrice: number; books?: B[] };
type CurCtx = ReturnType<typeof useCurrency>;

/** Bundle price, original total and savings in the visitor's currency (matches checkout). */
export function bundleMoney(c: CurCtx, bundle: BundleLike) {
  const books = bundle.books || [];
  if (c.currency === "INR" || !books.length) {
    const price = c.fromInr(bundle.bundlePrice);
    const original = c.fromInr(bundle.originalPrice);
    const savings = Math.max(0, Math.round((original - price) * 100) / 100);
    return { price, original, savings, pct: original > 0 ? Math.round((savings / original) * 100) : 0 };
  }
  const original = Math.round(books.reduce((s, b) => s + c.bookPrice(b).price, 0) * 100) / 100;
  const booksInr = books.reduce((s, b) => s + (b.price || 0), 0);
  const price = bundlePriceIn(c.currency, bundle.bundlePrice, booksInr, original, c.rates);
  const savings = Math.max(0, Math.round((original - price) * 100) / 100);
  const pct = original > 0 ? Math.round((savings / original) * 100) : 0;
  return { price, original, savings, pct };
}

export function useBundleMoney(bundle: BundleLike | null | undefined) {
  const c = useCurrency();
  const m = bundle ? bundleMoney(c, bundle) : { price: 0, original: 0, savings: 0, pct: 0 };
  return { ...m, fmt: c.fmt, ready: c.ready };
}
