// Server-side cart pricing. The browser never decides what a customer pays:
// the checkout total is always recomputed here from the database.

import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { BookModel, BundleModel, CouponModel, Order, User } from "@/models";
import { BOOKS, activeOffer } from "@/lib/books";
import { getDeals } from "@/lib/deals";
import { multiBuyTier, type DealsSettings } from "@/lib/deals-shared";
import { normalizeCouponCode } from "@/lib/coupons";
import { MULTI_CURRENCY, bookPriceIn, bundlePriceIn, isCurrency, type Currency, type Rates } from "@/lib/currency";
import { getRates } from "@/lib/fx";

// Referral percentages now live in /admin/deals (see getDeals().referral).

// Codes that worked before coupons moved to the database.
const LEGACY_COUPONS: Record<string, number> = { WELCOME20: 20, SAVE10: 10, VEEER50: 50 };

export type QuoteLine = { id: number; title: string; price: number; regularPrice?: number; launchEndsAt?: string; offerLabel?: string };
export type DiscountKind = "coupon" | "referral" | "multibuy" | "welcome";
export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  bundle?: { title: string; discount: number };
  discount?: { kind: DiscountKind; code: string; percent: number; amount: number; label: string };
  couponError?: string;
  /** "Add 1 more book to get 20% off" nudge. */
  nextTier?: { booksNeeded: number; percent: number };
  /** Guests: sign in to get the first-order discount. */
  welcomeHint?: number;
  referralNote?: string;
  /** Books removed because they're already in the customer's library. */
  owned?: number[];
  total: number;
  referrerUserId?: string;
  /** Currency of every amount in this quote, and INR per 1 unit of it. */
  currency: Currency;
  fxRate: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

async function loadBooks(ids: number[], deals: DealsSettings) {
  try {
    await connectDB();
    const docs = await BookModel.find({ id: { $in: ids }, isActive: true }, { htmlContent: 0 }).lean();
    if (docs.length) {
      return docs.map((d: any) => {
        const regular = Number(d.sellingPrice) > 0 ? d.sellingPrice : Number(d.price) > 0 ? d.price : Number(d.actualPrice) || 0;
        const launch = activeOffer(d, regular, deals.sale);
        return {
          id: d.id as number,
          title: d.title as string,
          price: launch ? launch.price : regular,
          regularPrice: launch ? regular : undefined,
          launchEndsAt: launch?.endsAt,
          offerLabel: launch?.label,
          actualInr: Number(d.actualPrice) || undefined,
          foreign: { USD: Number(d.priceUSD) || undefined, GBP: Number(d.priceGBP) || undefined },
        };
      });
    }
  } catch (e) {
    console.warn("pricing: DB unavailable, using built-in catalogue", (e as Error).message);
  }
  return BOOKS.filter((b) => ids.includes(b.id)).map((b) => ({
    id: b.id, title: b.title, price: b.price,
    regularPrice: undefined as number | undefined, launchEndsAt: undefined as string | undefined, offerLabel: undefined as string | undefined,
    actualInr: b.actualPrice, foreign: undefined as { USD?: number; GBP?: number } | undefined,
  }));
}

export type FoundCoupon = {
  code: string; kind: "percent" | "flat"; percent: number; flatInr: number; id?: string;
  minOrderInr: number; minBooks: number; firstOrderOnly: boolean; bookIds: number[];
};

async function hasPaidOrder(userId?: string) {
  if (!userId || !Types.ObjectId.isValid(userId)) return false;
  try { await connectDB(); return Boolean(await Order.exists({ userId, status: "paid" })); } catch { return false; }
}

export async function findCoupon(rawCode: string, userId?: string) {
  const code = normalizeCouponCode(rawCode || "");
  if (!code) return { error: "" as string, coupon: null as null | FoundCoupon };
  try {
    await connectDB();
    const c: any = await CouponModel.findOne({ code, active: true }).lean();
    if (c) {
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { error: "This coupon has expired.", coupon: null };
      if (c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) return { error: "This coupon has already been used.", coupon: null };
      if (c.ownerUserId && String(c.ownerUserId) !== String(userId || "")) {
        return { error: userId ? "This coupon belongs to another account." : "Sign in to use this coupon.", coupon: null };
      }
      if (c.startsAt && new Date(c.startsAt) > new Date()) return { error: "This coupon isn’t active yet.", coupon: null };
      const kind = c.kind === "flat" ? "flat" : "percent";
      const percent = Math.max(0, Math.min(100, Number(c.discountPercent) || 0));
      const flatInr = Math.max(0, Number(c.flatInr) || 0);
      if (kind === "percent" ? percent < 1 : flatInr < 1) return { error: "Invalid coupon code.", coupon: null };
      return {
        error: "",
        coupon: {
          code, kind, percent, flatInr, id: String(c._id),
          minOrderInr: Number(c.minOrderInr) || 0, minBooks: Number(c.minBooks) || 0,
          firstOrderOnly: Boolean(c.firstOrderOnly), bookIds: (c.bookIds || []).map(Number),
        } as FoundCoupon,
      };
    }
  } catch {
    /* fall through to legacy codes */
  }
  if (LEGACY_COUPONS[code]) return { error: "", coupon: { code, kind: "percent", percent: LEGACY_COUPONS[code], flatInr: 0, minOrderInr: 0, minBooks: 0, firstOrderOnly: false, bookIds: [] } as FoundCoupon };
  return { error: "Invalid coupon code.", coupon: null };
}

/** Referral discount applies to a signed-in customer's first paid order, not to their own link. */
async function checkReferral(refCode: string, userId: string | undefined, enabled: boolean) {
  const code = normalizeCouponCode(refCode || "");
  if (!code || !enabled) return null;
  try {
    await connectDB();
    const referrer: any = await User.findOne({ referralCode: code }, { _id: 1 }).lean();
    if (!referrer) return null;
    if (userId && String(referrer._id) === String(userId)) return { ok: false as const, note: "Your own referral link can’t be used on your account." };
    if (userId && Types.ObjectId.isValid(userId)) {
      const paid = await Order.exists({ userId, status: "paid" });
      if (paid) return { ok: false as const, note: "Friend discounts are for first purchases only." };
    }
    return { ok: true as const, code, referrerUserId: String(referrer._id) };
  } catch {
    return null;
  }
}

export async function quoteCart(opts: { items: number[]; couponCode?: string; refCode?: string; userId?: string; currency?: string }): Promise<Quote> {
  const currency: Currency = MULTI_CURRENCY && isCurrency(opts.currency) ? opts.currency : "INR";
  const rates: Rates | null = currency === "INR" ? null : await getRates();
  const fxRate = currency === "INR" ? 1 : rates![currency];
  let ids = Array.from(new Set((opts.items || []).map(Number).filter((n) => Number.isFinite(n) && n > 0))).slice(0, 100);

  // Never charge for a book the customer already owns.
  let owned: number[] = [];
  if (opts.userId && Types.ObjectId.isValid(opts.userId) && ids.length) {
    try {
      await connectDB();
      const u: any = await User.findById(opts.userId, { purchasedBooks: 1 }).lean();
      const have: number[] = u?.purchasedBooks || [];
      owned = ids.filter((id) => have.includes(id));
      ids = ids.filter((id) => !have.includes(id));
    } catch { /* if the lookup fails, price normally */ }
  }

  const deals = await getDeals();
  const raw = ids.length ? await loadBooks(ids, deals) : [];
  // Every amount is in the shopper's currency (INR, or USD/GBP for US/UK visitors).
  const lines: QuoteLine[] = raw.map((l) => {
    if (currency === "INR") return { id: l.id, title: l.title, price: l.price, regularPrice: l.regularPrice, launchEndsAt: l.launchEndsAt, offerLabel: l.offerLabel };
    const now = bookPriceIn(currency, rates!, { regularInr: l.regularPrice || l.price, currentInr: l.price, actualInr: l.actualInr, override: l.foreign });
    const reg = l.regularPrice ? bookPriceIn(currency, rates!, { regularInr: l.regularPrice, currentInr: l.regularPrice, override: l.foreign }).price : undefined;
    return { id: l.id, title: l.title, price: now.price, regularPrice: reg, launchEndsAt: l.launchEndsAt, offerLabel: l.offerLabel };
  });
  const subtotal = r2(lines.reduce((s, l) => s + l.price, 0));
  const quote: Quote = { lines, subtotal, total: subtotal, currency, fxRate, ...(owned.length ? { owned } : {}) };
  if (!lines.length) return quote;

  // Best matching bundle (largest saving) whose books are all in the cart.
  try {
    await connectDB();
    const bundles: any[] = await BundleModel.find({ isActive: true }).lean();
    let best: { title: string; discount: number } | undefined;
    for (const b of bundles) {
      const bIds: number[] = b.bookIds || [];
      if (!bIds.length || !bIds.every((id) => ids.includes(id))) continue;
      const sum = lines.filter((l) => bIds.includes(l.id)).reduce((s, l) => s + l.price, 0);
      const sumInr = raw.filter((l) => bIds.includes(l.id)).reduce((s, l) => s + l.price, 0);
      const bundleCur = Number(b.bundlePrice) > 0 ? (currency === "INR" ? Number(b.bundlePrice) : bundlePriceIn(currency, Number(b.bundlePrice), sumInr, sum, rates!)) : sum;
      const saving = r2(sum - bundleCur);
      if (saving > 0 && (!best || saving > best.discount)) best = { title: b.title, discount: saving };
    }
    if (best) quote.bundle = best;
  } catch {
    /* bundles are optional */
  }

  const afterBundle = Math.max(0, subtotal - (quote.bundle?.discount || 0));

  // One discount at a time: whichever of coupon / friend referral / multi-buy / first-order saves the most.
  const candidates: NonNullable<Quote["discount"]>[] = [];
  const paidBefore = opts.userId ? await hasPaidOrder(opts.userId) : false;
  const ratio = subtotal > 0 ? afterBundle / subtotal : 1;

  if (opts.couponCode) {
    const { coupon, error } = await findCoupon(opts.couponCode, opts.userId);
    if (coupon) {
      const eligible = coupon.bookIds.length ? lines.filter((l) => coupon.bookIds.includes(l.id)) : lines;
      const base = r2(eligible.reduce((s, l) => s + l.price, 0) * ratio);
      let problem = "";
      if (!eligible.length) problem = "This coupon doesn’t apply to the books in your cart.";
      else if (coupon.minBooks > 0 && lines.length < coupon.minBooks) problem = `Add ${coupon.minBooks - lines.length} more book${coupon.minBooks - lines.length === 1 ? "" : "s"} to use this coupon (minimum ${coupon.minBooks}).`;
      else if (coupon.minOrderInr > 0 && afterBundle * fxRate + 0.001 < coupon.minOrderInr) problem = `This coupon needs a minimum order of ₹${coupon.minOrderInr}.`;
      else if (coupon.firstOrderOnly && !opts.userId) problem = "Sign in to use this first-order coupon.";
      else if (coupon.firstOrderOnly && paidBefore) problem = "This coupon is for first orders only.";
      if (problem) quote.couponError = problem;
      else {
        const amount = coupon.kind === "flat" ? Math.min(base, r2(coupon.flatInr / fxRate)) : r2(base * coupon.percent / 100);
        const pct = base > 0 ? Math.round((amount / afterBundle) * 100) : 0;
        candidates.push({
          kind: "coupon", code: coupon.code, percent: coupon.kind === "flat" ? pct : coupon.percent, amount: r2(amount),
          label: coupon.kind === "flat" ? `Coupon ${coupon.code}` : `Coupon ${coupon.code} (${coupon.percent}% off)`,
        });
      }
    } else if (error) quote.couponError = error;
  }
  if (opts.refCode) {
    const ref = await checkReferral(opts.refCode, opts.userId, deals.referral.enabled);
    if (ref?.ok) {
      const p = deals.referral.friendPercent;
      candidates.push({ kind: "referral", code: ref.code, percent: p, amount: r2(afterBundle * p / 100), label: `Friend’s referral (${p}% off)` });
      quote.referrerUserId = ref.referrerUserId;
    } else if (ref && !ref.ok) quote.referralNote = ref.note;
  }
  const { tier, next } = multiBuyTier(deals.multiBuy, lines.length);
  if (tier) candidates.push({ kind: "multibuy", code: `MULTI${tier.minBooks}`, percent: tier.percent, amount: r2(afterBundle * tier.percent / 100), label: `Buy ${tier.minBooks}+ books (${tier.percent}% off)` });
  if (next) quote.nextTier = { booksNeeded: next.minBooks - lines.length, percent: next.percent };
  if (deals.firstOrder.enabled) {
    if (opts.userId && !paidBefore) {
      const p = deals.firstOrder.percent;
      candidates.push({ kind: "welcome", code: "WELCOME", percent: p, amount: r2(afterBundle * p / 100), label: `Welcome offer (${p}% off your first order)` });
    } else if (!opts.userId) quote.welcomeHint = deals.firstOrder.percent;
  }
  candidates.sort((a, b) => b.amount - a.amount);
  if (candidates[0]) {
    quote.discount = candidates[0];
    if (candidates[0].kind !== "referral") delete quote.referrerUserId;
  } else delete quote.referrerUserId;

  quote.total = r2(Math.max(0, afterBundle - (quote.discount?.amount || 0)));
  return quote;
}
