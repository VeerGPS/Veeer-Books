// Server-side cart pricing. The browser never decides what a customer pays:
// the checkout total is always recomputed here from the database.

import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { BookModel, BundleModel, CouponModel, Order, User } from "@/models";
import { BOOKS, activeLaunch } from "@/lib/books";
import { normalizeCouponCode } from "@/lib/coupons";

/** Friend discount for a first purchase made through a referral link. */
export const REFERRAL_FRIEND_PERCENT = 10;
/** Reward coupon the referrer gets for each friend's first purchase. */
export const REFERRAL_REWARD_PERCENT = 15;
export const REFERRAL_REWARD_DAYS = 90;

// Codes that worked before coupons moved to the database.
const LEGACY_COUPONS: Record<string, number> = { WELCOME20: 20, SAVE10: 10, VEEER50: 50 };

export type QuoteLine = { id: number; title: string; price: number; regularPrice?: number; launchEndsAt?: string };
export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  bundle?: { title: string; discount: number };
  discount?: { kind: "coupon" | "referral"; code: string; percent: number; amount: number; label: string };
  couponError?: string;
  referralNote?: string;
  total: number;
  referrerUserId?: string;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

async function loadBooks(ids: number[]) {
  try {
    await connectDB();
    const docs = await BookModel.find({ id: { $in: ids }, isActive: true }, { htmlContent: 0 }).lean();
    if (docs.length) {
      return docs.map((d: any) => {
        const regular = Number(d.sellingPrice) > 0 ? d.sellingPrice : Number(d.price) > 0 ? d.price : Number(d.actualPrice) || 0;
        const launch = activeLaunch(d, regular);
        return {
          id: d.id as number,
          title: d.title as string,
          price: launch ? launch.price : regular,
          regularPrice: launch ? regular : undefined,
          launchEndsAt: launch?.endsAt,
        };
      });
    }
  } catch (e) {
    console.warn("pricing: DB unavailable, using built-in catalogue", (e as Error).message);
  }
  return BOOKS.filter((b) => ids.includes(b.id)).map((b) => ({ id: b.id, title: b.title, price: b.price }));
}

export async function findCoupon(rawCode: string, userId?: string) {
  const code = normalizeCouponCode(rawCode || "");
  if (!code) return { error: "" as string, coupon: null as null | { code: string; percent: number; id?: string } };
  try {
    await connectDB();
    const c: any = await CouponModel.findOne({ code, active: true }).lean();
    if (c) {
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { error: "This coupon has expired.", coupon: null };
      if (c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) return { error: "This coupon has already been used.", coupon: null };
      if (c.ownerUserId && String(c.ownerUserId) !== String(userId || "")) {
        return { error: userId ? "This coupon belongs to another account." : "Sign in to use this coupon.", coupon: null };
      }
      const percent = Math.max(0, Math.min(100, Number(c.discountPercent) || 0));
      if (percent < 1) return { error: "Invalid coupon code.", coupon: null };
      return { error: "", coupon: { code, percent, id: String(c._id) } };
    }
  } catch {
    /* fall through to legacy codes */
  }
  if (LEGACY_COUPONS[code]) return { error: "", coupon: { code, percent: LEGACY_COUPONS[code] } };
  return { error: "Invalid coupon code.", coupon: null };
}

/** Referral discount applies to a signed-in customer's first paid order, not to their own link. */
async function checkReferral(refCode: string, userId?: string) {
  const code = normalizeCouponCode(refCode || "");
  if (!code) return null;
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

export async function quoteCart(opts: { items: number[]; couponCode?: string; refCode?: string; userId?: string }): Promise<Quote> {
  const ids = Array.from(new Set((opts.items || []).map(Number).filter((n) => Number.isFinite(n) && n > 0))).slice(0, 100);
  const lines = ids.length ? await loadBooks(ids) : [];
  const subtotal = r2(lines.reduce((s, l) => s + l.price, 0));
  const quote: Quote = { lines, subtotal, total: subtotal };
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
      const saving = r2(sum - (Number(b.bundlePrice) || sum));
      if (saving > 0 && (!best || saving > best.discount)) best = { title: b.title, discount: saving };
    }
    if (best) quote.bundle = best;
  } catch {
    /* bundles are optional */
  }

  const afterBundle = Math.max(0, subtotal - (quote.bundle?.discount || 0));

  // One discount at a time: whichever of coupon / referral saves more.
  const candidates: NonNullable<Quote["discount"]>[] = [];
  if (opts.couponCode) {
    const { coupon, error } = await findCoupon(opts.couponCode, opts.userId);
    if (coupon) candidates.push({ kind: "coupon", code: coupon.code, percent: coupon.percent, amount: r2(afterBundle * coupon.percent / 100), label: `Coupon ${coupon.code} (${coupon.percent}% off)` });
    else if (error) quote.couponError = error;
  }
  if (opts.refCode) {
    const ref = await checkReferral(opts.refCode, opts.userId);
    if (ref?.ok) {
      candidates.push({ kind: "referral", code: ref.code, percent: REFERRAL_FRIEND_PERCENT, amount: r2(afterBundle * REFERRAL_FRIEND_PERCENT / 100), label: `Friend’s referral (${REFERRAL_FRIEND_PERCENT}% off)` });
      quote.referrerUserId = ref.referrerUserId;
    } else if (ref && !ref.ok) quote.referralNote = ref.note;
  }
  candidates.sort((a, b) => b.amount - a.amount);
  if (candidates[0]) {
    quote.discount = candidates[0];
    if (candidates[0].kind !== "referral") delete quote.referrerUserId;
  } else delete quote.referrerUserId;

  quote.total = r2(Math.max(0, afterBundle - (quote.discount?.amount || 0)));
  return quote;
}
