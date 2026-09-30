// Shared (client + server) currency helpers. Prices are stored in INR; US and UK
// visitors see USD / GBP. A book can have its own USD/GBP price set in the admin
// panel; otherwise the INR price is converted and rounded to a friendly .49/.99.

export type Currency = "INR" | "USD" | "GBP";
export const CURRENCIES: Currency[] = ["INR", "USD", "GBP"];
export const CURRENCY_COOKIE = "vsb_cur";

/**
 * Master switch for US/UK pricing. Turn it on (Vercel env NEXT_PUBLIC_MULTI_CURRENCY=on)
 * only after Razorpay has enabled international payments — otherwise foreign
 * checkouts would fail. While off, everyone sees and pays in INR.
 */
export const MULTI_CURRENCY = process.env.NEXT_PUBLIC_MULTI_CURRENCY === "on";

export const CURRENCY_INFO: Record<Currency, { symbol: string; locale: string; label: string; flag: string }> = {
  INR: { symbol: "₹", locale: "en-IN", label: "India (₹ INR)", flag: "🇮🇳" },
  USD: { symbol: "$", locale: "en-US", label: "United States ($ USD)", flag: "🇺🇸" },
  GBP: { symbol: "£", locale: "en-GB", label: "United Kingdom (£ GBP)", flag: "🇬🇧" },
};

/** INR per 1 unit of foreign currency. */
export type Rates = { USD: number; GBP: number };
// Fallback only (late September 2026 mid-market); live rates are fetched daily on the server.
export const FALLBACK_RATES: Rates = { USD: 96, GBP: 127 };

export function isCurrency(x: unknown): x is Currency {
  return typeof x === "string" && (CURRENCIES as string[]).includes(x);
}

/** India → INR, UK → GBP, everyone else → USD. */
export function currencyForCountry(country?: string | null): Currency {
  const c = String(country || "").toUpperCase();
  if (!c || c === "IN") return "INR";
  if (c === "GB" || c === "UK" || c === "IM" || c === "JE" || c === "GG") return "GBP";
  return "USD";
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Converts an INR amount and rounds up to the next .49 / .99 (minimum .99). */
export function convertFromInr(inr: number, cur: Currency, rates: Rates): number {
  if (cur === "INR") return r2(inr);
  const rate = rates[cur] || FALLBACK_RATES[cur];
  const raw = (Number(inr) || 0) / rate;
  if (raw <= 0) return 0;
  return Math.max(0.99, r2(Math.ceil(raw * 2) / 2 - 0.01));
}

export type ForeignOverride = { USD?: number; GBP?: number };

/**
 * Price of a book in a currency.
 * regularInr = normal price, currentInr = price now (launch price if running), actualInr = crossed-out price.
 */
export function bookPriceIn(
  cur: Currency,
  rates: Rates,
  p: { regularInr: number; currentInr: number; actualInr?: number; override?: ForeignOverride }
): { price: number; actual?: number } {
  if (cur === "INR") {
    return { price: r2(p.currentInr), actual: p.actualInr && p.actualInr > p.currentInr ? p.actualInr : undefined };
  }
  const set = Number(p.override?.[cur]) || 0;
  let price: number;
  if (set > 0) {
    // Scale an explicit price by any launch discount, keeping the .99 style.
    const ratio = p.regularInr > 0 ? p.currentInr / p.regularInr : 1;
    price = ratio < 1 ? Math.max(0.99, r2(Math.ceil(set * ratio) - 0.01)) : set;
  } else {
    price = convertFromInr(p.currentInr, cur, rates);
  }
  let actual: number | undefined;
  if (p.actualInr && p.actualInr > p.currentInr) {
    actual = set > 0 && p.regularInr > 0 ? r2(Math.ceil(set * (p.actualInr / p.regularInr)) - 0.01) : convertFromInr(p.actualInr, cur, rates);
    if (!(actual > price)) actual = undefined;
  }
  return { price, actual };
}

export function formatMoney(amount: number, cur: Currency, opts: { decimals?: boolean } = {}) {
  const info = CURRENCY_INFO[cur];
  const n = Number(amount) || 0;
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  const digits = opts.decimals === false || (cur === "INR" && whole) ? 0 : 2;
  return info.symbol + n.toLocaleString(info.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * Bundle price in USD/GBP: keeps the same % discount as the INR bundle, applied to the
 * books' USD/GBP prices, then rounds to .49/.99. (INR bundles use the INR price as is.)
 */
export function bundlePriceIn(cur: Currency, bundleInr: number, booksInr: number, booksForeign: number, rates: Rates): number {
  if (cur === "INR") return r2(bundleInr);
  if (!(booksInr > 0) || !(booksForeign > 0)) return convertFromInr(bundleInr, cur, rates);
  const raw = booksForeign * (bundleInr / booksInr);
  return Math.max(0.99, r2(Math.ceil(raw * 2) / 2 - 0.01));
}
