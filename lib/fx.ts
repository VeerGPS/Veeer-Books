import { FALLBACK_RATES, type Rates } from "@/lib/currency";

/**
 * Live INR exchange rates (ECB reference rates via frankfurter.app), refreshed
 * twice a day. Falls back to FALLBACK_RATES if the service can't be reached.
 * Optional env overrides: FX_USD_INR, FX_GBP_INR.
 */
export async function getRates(): Promise<Rates> {
  const envUsd = Number(process.env.FX_USD_INR) || 0;
  const envGbp = Number(process.env.FX_GBP_INR) || 0;
  if (envUsd > 0 && envGbp > 0) return { USD: envUsd, GBP: envGbp };
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=INR&to=USD,GBP", {
      next: { revalidate: 43200, tags: ["fx"] },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`fx ${res.status}`);
    const j = await res.json();
    const usd = j?.rates?.USD ? 1 / j.rates.USD : 0;
    const gbp = j?.rates?.GBP ? 1 / j.rates.GBP : 0;
    if (usd > 20 && usd < 500 && gbp > 20 && gbp < 500) {
      return { USD: envUsd || Math.round(usd * 100) / 100, GBP: envGbp || Math.round(gbp * 100) / 100 };
    }
  } catch (e) {
    console.warn("FX rates unavailable, using fallback:", (e as Error).message);
  }
  return { USD: envUsd || FALLBACK_RATES.USD, GBP: envGbp || FALLBACK_RATES.GBP };
}
