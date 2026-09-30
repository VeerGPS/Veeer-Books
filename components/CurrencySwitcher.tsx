"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCIES, CURRENCY_INFO, MULTI_CURRENCY, type Currency } from "@/lib/currency";

/** Small ₹ / $ / £ picker. The right one is chosen automatically from the visitor's country. */
export default function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  if (!MULTI_CURRENCY) return null;
  return (
    <label className={`cur-switch ${className}`} title="Change currency">
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(e) => {
          setCurrency(e.target.value as Currency);
          document.documentElement.setAttribute("data-cur", e.target.value);
        }}
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{CURRENCY_INFO[c].flag} {c}</option>
        ))}
      </select>
    </label>
  );
}
