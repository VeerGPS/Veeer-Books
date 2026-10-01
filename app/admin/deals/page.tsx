"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminKey, verifyAdminPassword } from "@/lib/admin-client";
import { DEFAULT_DEALS, saleActiveFor, type DealsSettings, type Tier } from "@/lib/deals-shared";

type AdminBook = { id: number; title: string; slug: string; cover?: string; isActive: boolean; price: number; launchPrice: number; launchEndsAt: string | null };
type AdminCoupon = {
  _id: string; code: string; kind?: "percent" | "flat"; discountPercent: number; flatInr?: number; minOrderInr?: number; minBooks?: number;
  firstOrderOnly?: boolean; maxUses?: number; usedCount?: number; startsAt?: string; expiresAt?: string; bookIds?: number[]; note?: string;
  active: boolean; stats: { orders: number; revenueInr: number };
};

const inr = (n: number) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
/** ISO → value for <input type="datetime-local"> in the admin's own time zone. */
function toLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : undefined);
const inDays = (days: number, hour = 23, min = 59) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, min, 0, 0); return d.toISOString(); };
const when = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}), hour: "numeric", minute: "2-digit" });
};

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="dl-toggle">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="dl-switch" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

function Section({ id, icon, title, live, desc, children }: { id: string; icon: string; title: string; live?: boolean; desc: string; children: React.ReactNode }) {
  return (
    <section className="dl-card" id={id}>
      <div className="dl-card-head">
        <h2><span aria-hidden="true">{icon}</span> {title}</h2>
        {live !== undefined ? <span className={`dl-pill ${live ? "on" : ""}`}>{live ? "● Live" : "Off"}</span> : null}
      </div>
      <p className="dl-desc">{desc}</p>
      {children}
    </section>
  );
}

const EMPTY_COUPON = {
  originalCode: "", code: "", kind: "percent" as "percent" | "flat", discountPercent: "10", flatInr: "50", minOrderInr: "", minBooks: "",
  firstOrderOnly: false, maxUses: "", startsAt: "", expiresAt: "", bookIds: [] as number[], note: "", active: true,
};

export default function DealsAdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState<DealsSettings>(DEFAULT_DEALS);
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [subscribers, setSubscribers] = useState(0);
  const [flash, setFlash] = useState<{ where: string; text: string; bad?: boolean } | null>(null);
  const [saving, setSaving] = useState("");
  const [offerDraft, setOfferDraft] = useState<Record<number, { price: string; ends: string }>>({});
  const [cf, setCf] = useState(EMPTY_COUPON);

  const say = (where: string, text: string, bad = false) => { setFlash({ where, text, bad }); window.setTimeout(() => setFlash((f) => (f?.text === text ? null : f)), 6000); };
  const headers = () => ({ "Content-Type": "application/json", "x-admin-password": adminKey() });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/deals", { headers: headers(), cache: "no-store" });
      if (res.status === 401) { setAuthorized(false); return; }
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load");
      setDeals(j.deals); setBooks(j.books); setCoupons(j.coupons); setSubscribers(j.subscribers || 0);
      setOfferDraft(Object.fromEntries((j.books as AdminBook[]).map((b) => {
        const live = b.launchPrice > 0 && b.launchEndsAt && +new Date(b.launchEndsAt) > Date.now();
        return [b.id, { price: live ? String(b.launchPrice) : "", ends: live ? toLocal(b.launchEndsAt) : "" }];
      })));
      setAuthorized(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (adminKey()) void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unlock = async () => {
    if (await verifyAdminPassword(password)) void load();
    else setError("Incorrect admin password.");
  };

  const saveDeals = async (where: string, next: DealsSettings = deals) => {
    setSaving(where);
    try {
      const res = await fetch("/api/admin/deals", { method: "PUT", headers: headers(), body: JSON.stringify(next) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save");
      setDeals(j.deals);
      say(where, j.message || "Saved");
    } catch (e) { say(where, e instanceof Error ? e.message : "Could not save", true); }
    finally { setSaving(""); }
  };

  const set = <K extends keyof DealsSettings>(k: K, v: Partial<DealsSettings[K]>) => setDeals((d) => ({ ...d, [k]: { ...d[k], ...v } }));
  const activeBooks = useMemo(() => books.filter((b) => b.isActive), [books]);
  const title = (id: number) => books.find((b) => b.id === id)?.title || `Book #${id}`;

  // ─── Book offers ─────────────────────────────────────────────
  const saveOffer = async (b: AdminBook, end = false) => {
    const d = offerDraft[b.id] || { price: "", ends: "" };
    setSaving(`offer-${b.id}`);
    try {
      const res = await fetch("/api/admin/deals/book-offer", {
        method: "PATCH", headers: headers(),
        body: JSON.stringify(end ? { id: b.id, launchPrice: 0 } : { id: b.id, launchPrice: Number(d.price), launchEndsAt: fromLocal(d.ends) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save");
      say("offers", `${b.title}: ${j.message}`);
      await load();
    } catch (e) { say("offers", `${b.title}: ${e instanceof Error ? e.message : "Could not save"}`, true); }
    finally { setSaving(""); }
  };

  // ─── Coupons ─────────────────────────────────────────────────
  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("coupon");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST", headers: headers(),
        body: JSON.stringify({ ...cf, startsAt: fromLocal(cf.startsAt) || null, expiresAt: fromLocal(cf.expiresAt) || null }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save");
      say("coupons", `${j.message}: ${j.coupon.code}`);
      setCf(EMPTY_COUPON);
      await load();
    } catch (err) { say("coupons", err instanceof Error ? err.message : "Could not save", true); }
    finally { setSaving(""); }
  };
  const editCoupon = (c: AdminCoupon) => {
    setCf({
      originalCode: c.code, code: c.code, kind: c.kind === "flat" ? "flat" : "percent", discountPercent: String(c.discountPercent || 10), flatInr: String(c.flatInr || 50),
      minOrderInr: c.minOrderInr ? String(c.minOrderInr) : "", minBooks: c.minBooks ? String(c.minBooks) : "", firstOrderOnly: Boolean(c.firstOrderOnly),
      maxUses: c.maxUses ? String(c.maxUses) : "", startsAt: toLocal(c.startsAt), expiresAt: toLocal(c.expiresAt), bookIds: c.bookIds || [], note: c.note || "", active: c.active,
    });
    document.getElementById("coupons")?.scrollIntoView({ behavior: "smooth" });
  };
  const toggleCoupon = async (c: AdminCoupon) => {
    await fetch("/api/admin/coupons", { method: "PATCH", headers: headers(), body: JSON.stringify({ code: c.code, active: !c.active }) });
    void load();
  };
  const deleteCoupon = async (c: AdminCoupon) => {
    if (!window.confirm(`Delete coupon ${c.code}? Customers won't be able to use it any more.`)) return;
    await fetch(`/api/admin/coupons?code=${encodeURIComponent(c.code)}`, { method: "DELETE", headers: headers() });
    void load();
  };
  const couponStatus = (c: AdminCoupon) => {
    const now = Date.now();
    if (!c.active) return { t: "Off", cls: "" };
    if (c.expiresAt && +new Date(c.expiresAt) < now) return { t: "Expired", cls: "warn" };
    if (c.startsAt && +new Date(c.startsAt) > now) return { t: `Starts ${when(c.startsAt)}`, cls: "warn" };
    if (c.maxUses && (c.usedCount || 0) >= c.maxUses) return { t: "Used up", cls: "warn" };
    return { t: "● Live", cls: "on" };
  };

  // ─── Tiers ───────────────────────────────────────────────────
  const setTier = (i: number, v: Partial<Tier>) => set("multiBuy", { tiers: deals.multiBuy.tiers.map((t, j) => (j === i ? { ...t, ...v } : t)) });

  if (!authorized) {
    return (
      <main className="container" style={{ maxWidth: 420, padding: "4rem 16px" }}>
        <h1 style={{ fontFamily: "var(--serif)" }}>Deals &amp; offers</h1>
        <form onSubmit={(e) => { e.preventDefault(); void unlock(); }} style={{ display: "grid", gap: ".6rem" }}>
          <input type="password" className="gift-input" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <button className="btn btn-primary" disabled={loading}>{loading ? "Loading…" : "Unlock"}</button>
          {error ? <p className="gift-err">{error}</p> : null}
        </form>
      </main>
    );
  }

  const saleLive = saleActiveFor(deals.sale);
  const saleScheduled = deals.sale.enabled && !saleLive && deals.sale.startsAt && +new Date(deals.sale.startsAt) > Date.now();
  const liveOffers = books.filter((b) => b.launchPrice > 0 && b.launchEndsAt && +new Date(b.launchEndsAt) > Date.now());
  const liveCoupons = coupons.filter((c) => couponStatus(c).cls === "on");
  const msg = (where: string) => (flash?.where === where ? <p className={`dl-flash ${flash.bad ? "bad" : ""}`} role="status">{flash.text}</p> : null);
  const SaveBtn = ({ where, label = "Save" }: { where: string; label?: string }) => (
    <button className="btn btn-primary btn-sm" disabled={saving === where} onClick={() => saveDeals(where)}>{saving === where ? "Saving…" : label}</button>
  );

  return (
    <main className="dl container">
      <div className="dl-head">
        <div>
          <h1>Deals &amp; offers</h1>
          <p>Create and change every offer on your store yourself. Changes go live within a few seconds.</p>
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          <Link href="/admin" className="btn btn-outline btn-sm">← Admin</Link>
        </div>
      </div>

      {/* Live summary */}
      <div className="dl-live">
        <b>Running now:</b>
        {saleLive ? <a href="#sale" className="dl-chip">🔥 {deals.sale.label} · {deals.sale.percent}% off</a> : null}
        {saleScheduled ? <a href="#sale" className="dl-chip dim">🔥 {deals.sale.label} starts {when(deals.sale.startsAt)}</a> : null}
        {liveOffers.map((b) => <a key={b.id} href="#offers" className="dl-chip">🏷️ {b.title} at {inr(b.launchPrice)}</a>)}
        {liveCoupons.length ? <a href="#coupons" className="dl-chip">🎟️ {liveCoupons.length} coupon{liveCoupons.length === 1 ? "" : "s"}</a> : null}
        {deals.multiBuy.enabled ? <a href="#multibuy" className="dl-chip">📚 Buy more, save more</a> : null}
        {deals.firstOrder.enabled ? <a href="#welcome" className="dl-chip">👋 {deals.firstOrder.percent}% off first order</a> : null}
        {deals.gift.enabled ? <a href="#gift" className="dl-chip">🎁 Free book: {title(deals.gift.bookId)}</a> : null}
        {deals.referral.enabled ? <a href="#referral" className="dl-chip">🤝 Referrals</a> : null}
      </div>
      <p className="dl-note">ℹ️ Customers get <b>one cart discount at a time</b> — a coupon, friend referral, buy-more or first-order discount — and the store automatically picks the one that saves them the most. Sale prices, book offers and bundles are already in the book price, so they combine with that discount.</p>

      {/* 1. Store-wide sale */}
      <Section id="sale" icon="🔥" title="Store-wide sale" live={saleLive} desc="Take a % off every book (or only the books you pick) for a set time. Prices, crossed-out prices and a countdown update across the whole store, and the top bar announces it.">
        <Toggle on={deals.sale.enabled} onChange={(v) => set("sale", { enabled: v, endsAt: v && !deals.sale.endsAt ? inDays(3) : deals.sale.endsAt })} label="Sale is on" />
        <div className="dl-grid">
          <label>Sale name<input value={deals.sale.label} onChange={(e) => set("sale", { label: e.target.value })} placeholder="Diwali Sale" maxLength={40} /></label>
          <label>Discount (%)<input type="number" min={1} max={90} value={deals.sale.percent} onChange={(e) => set("sale", { percent: Number(e.target.value) })} /></label>
          <label>Starts <small>(empty = right away)</small><input type="datetime-local" value={toLocal(deals.sale.startsAt)} onChange={(e) => set("sale", { startsAt: fromLocal(e.target.value) })} /></label>
          <label>Ends<input type="datetime-local" value={toLocal(deals.sale.endsAt)} onChange={(e) => set("sale", { endsAt: fromLocal(e.target.value) })} /></label>
        </div>
        <div className="dl-quick">
          Quick end: {[1, 3, 7].map((d) => <button key={d} type="button" onClick={() => set("sale", { endsAt: inDays(d) })}>{d === 1 ? "1 day" : `${d} days`}</button>)}
          <button type="button" onClick={() => set("sale", { endsAt: inDays(0) })}>Tonight</button>
        </div>
        <div className="dl-radio">
          <label><input type="radio" checked={deals.sale.scope === "all"} onChange={() => set("sale", { scope: "all" })} /> All books</label>
          <label><input type="radio" checked={deals.sale.scope === "selected"} onChange={() => set("sale", { scope: "selected" })} /> Only these books:</label>
        </div>
        {deals.sale.scope === "selected" ? (
          <div className="dl-books">
            {activeBooks.map((b) => (
              <label key={b.id}><input type="checkbox" checked={deals.sale.bookIds.includes(b.id)} onChange={(e) => set("sale", { bookIds: e.target.checked ? [...deals.sale.bookIds, b.id] : deals.sale.bookIds.filter((x) => x !== b.id) })} /> {b.title}</label>
            ))}
          </div>
        ) : null}
        <div className="dl-preview">
          Example: a {inr(199)} book shows <b>{inr(Math.max(1, Math.round(199 * (1 - (deals.sale.percent || 0) / 100))))}</b> <s>{inr(199)}</s> with “🔥 {deals.sale.label || "Sale"} ends in …”.
          If a book also has its own offer price below, customers get whichever is lower.
        </div>
        <div className="dl-actions"><SaveBtn where="sale" label="Save sale" />{msg("sale")}</div>
      </Section>

      {/* 2. Book offers */}
      <Section id="offers" icon="🏷️" title="Book price offers" live={liveOffers.length > 0} desc="A special price on one book until a date — perfect for a new launch or a weekend deal. The book page shows a countdown and the regular price crossed out.">
        <div className="dl-table-wrap">
          <table className="dl-table">
            <thead><tr><th>Book</th><th className="num">Regular</th><th>Offer price (₹)</th><th>Ends</th><th /></tr></thead>
            <tbody>
              {activeBooks.map((b) => {
                const d = offerDraft[b.id] || { price: "", ends: "" };
                const live = liveOffers.some((x) => x.id === b.id);
                return (
                  <tr key={b.id}>
                    <td><b>{b.title}</b>{live ? <span className="dl-pill on sm">Live until {when(b.launchEndsAt)}</span> : null}</td>
                    <td className="num">{inr(b.price)}</td>
                    <td><input type="number" min={1} placeholder="e.g. 99" value={d.price} onChange={(e) => setOfferDraft((o) => ({ ...o, [b.id]: { ...d, price: e.target.value } }))} /></td>
                    <td><input type="datetime-local" value={d.ends} onChange={(e) => setOfferDraft((o) => ({ ...o, [b.id]: { ...d, ends: e.target.value } }))} /></td>
                    <td className="dl-row-actions">
                      <button className="btn btn-primary btn-sm" disabled={saving === `offer-${b.id}` || !d.price} onClick={() => saveOffer(b)}>{live ? "Update" : "Start"}</button>
                      {live ? <button className="btn btn-outline btn-sm" disabled={saving === `offer-${b.id}`} onClick={() => saveOffer(b, true)}>End now</button> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {msg("offers")}
      </Section>

      {/* 3. Coupons */}
      <Section id="coupons" icon="🎟️" title="Coupon codes" live={liveCoupons.length > 0} desc="Codes customers type in the cart. Use them for Instagram followers, WhatsApp groups, influencers or thank-you emails — and see how many orders each one brought.">
        <form className="dl-coupon-form" onSubmit={saveCoupon}>
          <div className="dl-grid">
            <label>Code<input required value={cf.code} onChange={(e) => setCf({ ...cf, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="INSTA20" maxLength={20} /></label>
            <label>Type
              <select value={cf.kind} onChange={(e) => setCf({ ...cf, kind: e.target.value as "percent" | "flat" })}>
                <option value="percent">% off</option>
                <option value="flat">₹ amount off</option>
              </select>
            </label>
            {cf.kind === "percent"
              ? <label>Discount (%)<input type="number" min={1} max={100} required value={cf.discountPercent} onChange={(e) => setCf({ ...cf, discountPercent: e.target.value })} /></label>
              : <label>Amount off (₹)<input type="number" min={1} required value={cf.flatInr} onChange={(e) => setCf({ ...cf, flatInr: e.target.value })} /></label>}
            <label>Max uses <small>(empty = unlimited)</small><input type="number" min={0} value={cf.maxUses} onChange={(e) => setCf({ ...cf, maxUses: e.target.value })} /></label>
            <label>Minimum order (₹)<input type="number" min={0} value={cf.minOrderInr} onChange={(e) => setCf({ ...cf, minOrderInr: e.target.value })} placeholder="none" /></label>
            <label>Minimum books<input type="number" min={0} value={cf.minBooks} onChange={(e) => setCf({ ...cf, minBooks: e.target.value })} placeholder="none" /></label>
            <label>Starts <small>(optional)</small><input type="datetime-local" value={cf.startsAt} onChange={(e) => setCf({ ...cf, startsAt: e.target.value })} /></label>
            <label>Expires <small>(optional)</small><input type="datetime-local" value={cf.expiresAt} onChange={(e) => setCf({ ...cf, expiresAt: e.target.value })} /></label>
          </div>
          <label className="dl-check"><input type="checkbox" checked={cf.firstOrderOnly} onChange={(e) => setCf({ ...cf, firstOrderOnly: e.target.checked })} /> First order only (new customers)</label>
          <details className="dl-details" open={cf.bookIds.length > 0}>
            <summary>Only for certain books {cf.bookIds.length ? `(${cf.bookIds.length} chosen)` : "(optional — leave empty for the whole cart)"}</summary>
            <div className="dl-books">
              {activeBooks.map((b) => (
                <label key={b.id}><input type="checkbox" checked={cf.bookIds.includes(b.id)} onChange={(e) => setCf({ ...cf, bookIds: e.target.checked ? [...cf.bookIds, b.id] : cf.bookIds.filter((x) => x !== b.id) })} /> {b.title}</label>
              ))}
            </div>
          </details>
          <label className="dl-full">Private note <small>(only you see this)</small><input value={cf.note} onChange={(e) => setCf({ ...cf, note: e.target.value })} placeholder="e.g. Instagram story 12 Oct" maxLength={120} /></label>
          <div className="dl-actions">
            <button className="btn btn-primary btn-sm" disabled={saving === "coupon"}>{saving === "coupon" ? "Saving…" : cf.originalCode ? `Update ${cf.originalCode}` : "Create coupon"}</button>
            {cf.originalCode ? <button type="button" className="btn btn-outline btn-sm" onClick={() => setCf(EMPTY_COUPON)}>Cancel edit</button> : null}
            {msg("coupons")}
          </div>
        </form>

        <div className="dl-table-wrap">
          <table className="dl-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Rules</th><th className="num">Used</th><th className="num">Orders · sales</th><th>Status</th><th /></tr></thead>
            <tbody>
              {coupons.map((c) => {
                const st = couponStatus(c);
                const rules = [
                  c.minOrderInr ? `min ${inr(c.minOrderInr)}` : "",
                  c.minBooks ? `min ${c.minBooks} books` : "",
                  c.firstOrderOnly ? "first order" : "",
                  c.bookIds?.length ? `${c.bookIds.length} book${c.bookIds.length === 1 ? "" : "s"}` : "",
                  c.expiresAt ? `until ${when(c.expiresAt)}` : "",
                ].filter(Boolean).join(" · ");
                return (
                  <tr key={c._id}>
                    <td><b className="dl-code">{c.code}</b>{c.note ? <div className="muted sm">{c.note}</div> : null}</td>
                    <td>{c.kind === "flat" ? `${inr(c.flatInr || 0)} off` : `${c.discountPercent}% off`}</td>
                    <td className="sm">{rules || <span className="muted">none</span>}</td>
                    <td className="num">{c.usedCount || 0}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                    <td className="num">{c.stats.orders} · {inr(c.stats.revenueInr)}</td>
                    <td><span className={`dl-pill sm ${st.cls}`}>{st.t}</span></td>
                    <td className="dl-row-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => editCoupon(c)}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleCoupon(c)}>{c.active ? "Turn off" : "Turn on"}</button>
                      <button className="btn btn-outline btn-sm dl-danger" onClick={() => deleteCoupon(c)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {!coupons.length ? <tr><td colSpan={7} className="muted">No coupons yet — create your first one above.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4. Multi-buy */}
      <Section id="multibuy" icon="📚" title="Buy more, save more" live={deals.multiBuy.enabled} desc="An automatic discount when someone buys several books together — no code needed. The cart also nudges shoppers: “Add 1 more book and get 20% off”.">
        <Toggle on={deals.multiBuy.enabled} onChange={(v) => set("multiBuy", { enabled: v })} label="Buy-more discount is on" />
        <div className="dl-tiers">
          {deals.multiBuy.tiers.map((t, i) => (
            <div className="dl-tier" key={i}>
              Buy <input type="number" min={2} max={50} value={t.minBooks} onChange={(e) => setTier(i, { minBooks: Number(e.target.value) })} /> or more books →
              <input type="number" min={1} max={90} value={t.percent} onChange={(e) => setTier(i, { percent: Number(e.target.value) })} />% off
              <button type="button" className="dl-x" aria-label="Remove" onClick={() => set("multiBuy", { tiers: deals.multiBuy.tiers.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          {deals.multiBuy.tiers.length < 6 ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => {
              const last = deals.multiBuy.tiers[deals.multiBuy.tiers.length - 1];
              set("multiBuy", { tiers: [...deals.multiBuy.tiers, { minBooks: (last?.minBooks || 1) + 1, percent: Math.min(90, (last?.percent || 5) + 5) }] });
            }}>+ Add a level</button>
          ) : null}
        </div>
        <div className="dl-actions"><SaveBtn where="multibuy" />{msg("multibuy")}</div>
      </Section>

      {/* 5. First order */}
      <Section id="welcome" icon="👋" title="First-order welcome discount" live={deals.firstOrder.enabled} desc="Every new customer gets this automatically on their first purchase (after signing in). Guests see “Sign in to get X% off your first order” in the cart.">
        <Toggle on={deals.firstOrder.enabled} onChange={(v) => set("firstOrder", { enabled: v })} label="Welcome discount is on" />
        <div className="dl-grid">
          <label>Discount (%)<input type="number" min={1} max={90} value={deals.firstOrder.percent} onChange={(e) => set("firstOrder", { percent: Number(e.target.value) })} /></label>
        </div>
        <div className="dl-actions"><SaveBtn where="welcome" />{msg("welcome")}</div>
      </Section>

      {/* 6. Free book */}
      <Section id="gift" icon="🎁" title="Free book for joining your list" live={deals.gift.enabled} desc="Visitors enter their email and get a full book free. This powers the top bar, the pop-up, the /free-book page and the banner on book pages.">
        <Toggle on={deals.gift.enabled} onChange={(v) => set("gift", { enabled: v })} label="Free-book offer is on" />
        <div className="dl-grid">
          <label>Free book
            <select value={deals.gift.bookId} onChange={(e) => set("gift", { bookId: Number(e.target.value) })}>
              {activeBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </label>
          <label className="dl-span2">Short pitch <small>(optional — shown under the title)</small><input value={deals.gift.pitch} onChange={(e) => set("gift", { pitch: e.target.value })} placeholder="A breathtaking fantasy saga…" maxLength={300} /></label>
        </div>
        <p className="muted sm">{subscribers} people have joined your list so far. <Link href="/admin/audience">See them →</Link></p>
        <div className="dl-actions"><SaveBtn where="gift" />{msg("gift")}</div>
      </Section>

      {/* 7. Referral */}
      <Section id="referral" icon="🤝" title="Refer-a-friend rewards" live={deals.referral.enabled} desc="Readers share their link from the Refer & earn page. Friends save on their first order; the reader gets a one-time reward coupon for every friend who buys.">
        <Toggle on={deals.referral.enabled} onChange={(v) => set("referral", { enabled: v })} label="Referral programme is on" />
        <div className="dl-grid">
          <label>Friend gets (% off first order)<input type="number" min={1} max={90} value={deals.referral.friendPercent} onChange={(e) => set("referral", { friendPercent: Number(e.target.value) })} /></label>
          <label>Referrer earns (% off coupon)<input type="number" min={1} max={90} value={deals.referral.rewardPercent} onChange={(e) => set("referral", { rewardPercent: Number(e.target.value) })} /></label>
          <label>Reward coupon valid (days)<input type="number" min={1} max={3650} value={deals.referral.rewardDays} onChange={(e) => set("referral", { rewardDays: Number(e.target.value) })} /></label>
        </div>
        <div className="dl-actions"><SaveBtn where="referral" />{msg("referral")}</div>
      </Section>

      {/* 8. Top bar & popups */}
      <Section id="bar" icon="📣" title="Top bar & pop-ups" desc="The thin announcement bar on every page, and the pop-ups visitors see.">
        <div className="dl-radio col">
          <label><input type="radio" checked={deals.bar.mode === "auto"} onChange={() => set("bar", { mode: "auto" })} /> <b>Automatic</b> — free book for new visitors, then your sale (if one is running), then your bundle offer</label>
          <label><input type="radio" checked={deals.bar.mode === "custom"} onChange={() => set("bar", { mode: "custom" })} /> <b>My own message</b></label>
          <label><input type="radio" checked={deals.bar.mode === "off"} onChange={() => set("bar", { mode: "off" })} /> <b>Hide the top bar</b></label>
        </div>
        {deals.bar.mode === "custom" ? (
          <>
            <div className="dl-grid">
              <label className="dl-span2">Message<input value={deals.bar.text} onChange={(e) => set("bar", { text: e.target.value })} placeholder="🪔 Diwali special: use code DIWALI30 for 30% off" maxLength={140} /></label>
              <label>Button text<input value={deals.bar.button} onChange={(e) => set("bar", { button: e.target.value })} placeholder="Shop now" maxLength={30} /></label>
              <label>Button link<input value={deals.bar.link} onChange={(e) => set("bar", { link: e.target.value })} placeholder="/#collection or /product/…" /></label>
            </div>
            <div className="dl-barpreview"><span>{deals.bar.text || "Your message"}</span>{deals.bar.button ? <em>{deals.bar.button} →</em> : null}</div>
          </>
        ) : null}
        <hr className="dl-hr" />
        <Toggle on={deals.popups.gift} onChange={(v) => set("popups", { gift: v })} label="Show the free-book pop-up" />
        {deals.popups.gift ? (
          <div className="dl-grid"><label>Show it after (seconds)<input type="number" min={0} max={300} value={deals.popups.giftDelaySeconds} onChange={(e) => set("popups", { giftDelaySeconds: Number(e.target.value) })} /></label></div>
        ) : null}
        <Toggle on={deals.popups.bundle} onChange={(v) => set("popups", { bundle: v })} label="Show the bundle pop-up to returning visitors" />
        <div className="dl-actions"><SaveBtn where="bar" />{msg("bar")}</div>
      </Section>

      {/* 9. Bundles */}
      <Section id="bundles" icon="📦" title="Bundles" desc="Sell several books together at one price (for example a Starter Pack). Bundles are managed on the main admin page.">
        <Link href="/admin#bundles" className="btn btn-outline btn-sm">Manage bundles →</Link>
      </Section>
    </main>
  );
}
