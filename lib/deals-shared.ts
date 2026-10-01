// Deals & offers settings — types, defaults and validation. Safe to import in the browser.

export type SaleDeal = {
  enabled: boolean;
  percent: number;
  label: string;
  startsAt?: string;
  endsAt?: string;
  scope: "all" | "selected";
  bookIds: number[];
};
export type Tier = { minBooks: number; percent: number };

export type DealsSettings = {
  /** Store-wide (or selected books) % off, shown on every price with a countdown. */
  sale: SaleDeal;
  /** Buy more, save more — applied automatically in the cart. */
  multiBuy: { enabled: boolean; tiers: Tier[] };
  /** Automatic discount on a signed-in customer's first paid order. */
  firstOrder: { enabled: boolean; percent: number };
  /** Free book for joining the email list. */
  gift: { enabled: boolean; bookId: number; pitch: string };
  /** Refer-a-friend rewards. */
  referral: { enabled: boolean; friendPercent: number; rewardPercent: number; rewardDays: number };
  /** Thin announcement bar at the top of every page. */
  bar: { mode: "auto" | "custom" | "off"; text: string; link: string; button: string };
  popups: { gift: boolean; giftDelaySeconds: number; bundle: boolean };
};

export const DEFAULT_DEALS: DealsSettings = {
  sale: { enabled: false, percent: 20, label: "Festive Sale", scope: "all", bookIds: [] },
  multiBuy: { enabled: false, tiers: [{ minBooks: 2, percent: 10 }, { minBooks: 3, percent: 20 }] },
  firstOrder: { enabled: false, percent: 10 },
  gift: { enabled: true, bookId: 3, pitch: "" },
  referral: { enabled: true, friendPercent: 10, rewardPercent: 15, rewardDays: 90 },
  bar: { mode: "auto", text: "", link: "/", button: "Shop now" },
  popups: { gift: true, giftDelaySeconds: 12, bundle: true },
};

const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const str = (v: unknown, max: number, dflt = "") => (typeof v === "string" ? v.trim().slice(0, max) : dflt);
const bool = (v: unknown, dflt: boolean) => (typeof v === "boolean" ? v : dflt);
const date = (v: unknown) => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return isNaN(+d) ? undefined : d.toISOString();
};
const ids = (v: unknown) => (Array.isArray(v) ? Array.from(new Set(v.map(Number).filter((n) => Number.isInteger(n) && n > 0))).slice(0, 200) : []);
const safeLink = (v: unknown) => {
  const s = str(v, 300, "/");
  return s.startsWith("/") || /^https:\/\//i.test(s) ? s : "/";
};

/** Merge saved/posted settings over the defaults and clamp every value to something safe. */
export function normalizeDeals(raw: any): DealsSettings {
  const d = DEFAULT_DEALS;
  const r = raw && typeof raw === "object" ? raw : {};
  const sale = r.sale || {}, mb = r.multiBuy || {}, fo = r.firstOrder || {}, g = r.gift || {}, ref = r.referral || {}, bar = r.bar || {}, pop = r.popups || {};
  const tiers: Tier[] = (Array.isArray(mb.tiers) ? mb.tiers : d.multiBuy.tiers)
    .map((t: any) => ({ minBooks: Math.round(num(t?.minBooks, 2, 50, 2)), percent: num(t?.percent, 1, 90, 10) }))
    .filter((t: Tier, i: number, a: Tier[]) => a.findIndex((x) => x.minBooks === t.minBooks) === i)
    .sort((a: Tier, b: Tier) => a.minBooks - b.minBooks)
    .slice(0, 6);
  return {
    sale: {
      enabled: bool(sale.enabled, d.sale.enabled),
      percent: num(sale.percent, 1, 90, d.sale.percent),
      label: str(sale.label, 40, d.sale.label) || d.sale.label,
      startsAt: date(sale.startsAt),
      endsAt: date(sale.endsAt),
      scope: sale.scope === "selected" ? "selected" : "all",
      bookIds: ids(sale.bookIds),
    },
    multiBuy: { enabled: bool(mb.enabled, d.multiBuy.enabled), tiers },
    firstOrder: { enabled: bool(fo.enabled, d.firstOrder.enabled), percent: num(fo.percent, 1, 90, d.firstOrder.percent) },
    gift: { enabled: bool(g.enabled, d.gift.enabled), bookId: Math.round(num(g.bookId, 1, 1e9, d.gift.bookId)), pitch: str(g.pitch, 300) },
    referral: {
      enabled: bool(ref.enabled, d.referral.enabled),
      friendPercent: num(ref.friendPercent, 1, 90, d.referral.friendPercent),
      rewardPercent: num(ref.rewardPercent, 1, 90, d.referral.rewardPercent),
      rewardDays: Math.round(num(ref.rewardDays, 1, 3650, d.referral.rewardDays)),
    },
    bar: {
      mode: bar.mode === "custom" || bar.mode === "off" ? bar.mode : "auto",
      text: str(bar.text, 140),
      link: safeLink(bar.link),
      button: str(bar.button, 30, d.bar.button),
    },
    popups: {
      gift: bool(pop.gift, d.popups.gift),
      giftDelaySeconds: Math.round(num(pop.giftDelaySeconds, 0, 300, d.popups.giftDelaySeconds)),
      bundle: bool(pop.bundle, d.popups.bundle),
    },
  };
}

/** Is the sale running right now (and does it cover this book)? */
export function saleActiveFor(sale: SaleDeal, bookId?: number, now = Date.now()) {
  if (!sale.enabled || !sale.endsAt) return false;
  if (sale.startsAt && +new Date(sale.startsAt) > now) return false;
  if (+new Date(sale.endsAt) <= now) return false;
  if (sale.scope === "selected" && bookId !== undefined && !sale.bookIds.includes(bookId)) return false;
  return true;
}

/** Best multi-buy tier for a number of books, plus the next tier to nudge towards. */
export function multiBuyTier(mb: DealsSettings["multiBuy"], count: number) {
  if (!mb.enabled || !mb.tiers.length) return { tier: undefined as Tier | undefined, next: undefined as Tier | undefined };
  const reached = mb.tiers.filter((t) => count >= t.minBooks);
  return { tier: reached[reached.length - 1], next: mb.tiers.find((t) => count < t.minBooks) };
}

export type GiftBookInfo = { id: number; slug: string; title: string; cover: string; pages: number; price: number; pitch: string };

/** What the browser needs to show offers (no admin-only data). */
export type PublicDeals = {
  gift: GiftBookInfo | null;
  sale: { active: boolean; percent: number; label: string; endsAt?: string; scope: "all" | "selected" };
  multiBuy: DealsSettings["multiBuy"];
  firstOrder: DealsSettings["firstOrder"];
  referral: DealsSettings["referral"];
  bar: DealsSettings["bar"];
  popups: DealsSettings["popups"];
};
