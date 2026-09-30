"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CURRENCY_COOKIE, FALLBACK_RATES, MULTI_CURRENCY, bookPriceIn, convertFromInr, formatMoney, isCurrency,
  type Currency, type ForeignOverride, type Rates,
} from "@/lib/currency";

type PriceInput = { price: number; actualPrice?: number; regularPrice?: number; foreign?: ForeignOverride };

type Ctx = {
  currency: Currency;
  rates: Rates;
  ready: boolean;
  setCurrency: (c: Currency) => void;
  /** Price of a book (from a BookSummary-like object) in the visitor's currency. */
  bookPrice: (b: PriceInput) => { price: number; actual?: number };
  /** Converts any INR amount (e.g. a bundle price). */
  fromInr: (inr: number) => number;
  fmt: (amount: number) => string;
};

const CurrencyCtx = createContext<Ctx | null>(null);

function readCookie(): Currency | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]+)`));
  const v = m ? decodeURIComponent(m[1]) : null;
  return isCurrency(v) ? v : null;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCur] = useState<Currency>("INR");
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = MULTI_CURRENCY ? readCookie() : "INR";
    if (c) setCur(c);
    if (c && c !== "INR") {
      fetch("/api/fx").then((r) => r.json()).then((j) => { if (j?.rates) setRates(j.rates); }).catch(() => {}).finally(() => setReady(true));
    } else setReady(true);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    if (!MULTI_CURRENCY) return;
    document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    setCur(c);
    if (c !== "INR") fetch("/api/fx").then((r) => r.json()).then((j) => { if (j?.rates) setRates(j.rates); }).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => ({
    currency,
    rates,
    ready,
    setCurrency,
    bookPrice: (b) => bookPriceIn(currency, rates, {
      regularInr: b.regularPrice || b.price,
      currentInr: b.price,
      actualInr: b.actualPrice,
      override: b.foreign,
    }),
    fromInr: (inr) => convertFromInr(inr, currency, rates),
    fmt: (amount) => formatMoney(amount, currency),
  }), [currency, rates, ready, setCurrency]);

  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}

export function useCurrency() {
  const c = useContext(CurrencyCtx);
  if (!c) throw new Error("useCurrency must be used inside CurrencyProvider");
  return c;
}
