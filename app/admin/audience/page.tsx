"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminKey, verifyAdminPassword } from "@/lib/admin-client";

type Signup = { email: string; name: string; source: string; signedUpAt: string; hasAccount: boolean; unsubscribed: boolean; customer: boolean; orders: number; spentInr: number };
type Customer = { name: string; email: string; joinedAt?: string; orders: number; books: number; spentInr: number; firstPurchase: string; lastPurchase: string; currencies: string[]; freeBookSubscriber: boolean; referred: boolean };
type Data = {
  giftBook: string;
  stats: { signups: number; last7: number; last30: number; withAccount: number; converted: number; conversionRate: number; revenueFromSubscribersInr: number; customers: number; totalRevenueInr: number; bySource: Record<string, number> };
  daily: { date: string; count: number }[];
  signups: Signup[];
  customers: Customer[];
};

const inr = (n: number) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const date = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const SOURCE_LABEL: Record<string, string> = { popup: "Pop-up", footer: "Footer", home: "Home page", landing: "Free-book page", blog: "Blog", site: "Website", test: "Test" };

function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}
function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function AudiencePage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"signups" | "customers">("signups");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "customers" | "not">("all");
  const [hover, setHover] = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/audience", { headers: { "x-admin-password": adminKey() } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally { setLoading(false); }
  };

  const unlock = async () => {
    if (await verifyAdminPassword(password)) { setAuthorized(true); void load(); }
    else setError("Incorrect admin password.");
  };

  const signups = useMemo(() => {
    const s = (data?.signups || []).filter((r) => filter === "all" || (filter === "customers" ? r.customer : !r.customer));
    const t = q.trim().toLowerCase();
    return t ? s.filter((r) => r.email.includes(t) || r.name.toLowerCase().includes(t)) : s;
  }, [data, q, filter]);
  const customers = useMemo(() => {
    const t = q.trim().toLowerCase();
    const c = data?.customers || [];
    return t ? c.filter((r) => r.email.toLowerCase().includes(t) || r.name.toLowerCase().includes(t)) : c;
  }, [data, q]);

  if (!authorized) {
    return (
      <main className="container" style={{ maxWidth: 420, padding: "4rem 16px" }}>
        <h1 style={{ fontFamily: "var(--serif)" }}>Free book &amp; customers</h1>
        <form onSubmit={(e) => { e.preventDefault(); void unlock(); }} style={{ display: "grid", gap: ".6rem" }}>
          <input type="password" className="gift-input" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary">Unlock</button>
          {error ? <p className="gift-err">{error}</p> : null}
        </form>
      </main>
    );
  }

  const s = data?.stats;
  const max = Math.max(1, ...(data?.daily || []).map((d) => d.count));

  return (
    <main className="aud container">
      <div className="aud-head">
        <div>
          <h1>Free book &amp; customers</h1>
          <p>Everyone who claimed <b>{data?.giftBook || "the free book"}</b>, and everyone who has bought from you.</p>
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          <Link href="/admin" className="btn btn-outline btn-sm">← Admin</Link>
        </div>
      </div>

      {error ? <p className="gift-err">{error}</p> : null}

      <div className="aud-kpis">
        <div><span>Free-book sign-ups</span><b>{s ? s.signups : "—"}</b><small>{s ? `${s.last7} this week · ${s.last30} in 30 days` : ""}</small></div>
        <div><span>Became customers</span><b>{s ? s.converted : "—"}</b><small>{s ? `${s.conversionRate}% of sign-ups bought a book` : ""}</small></div>
        <div><span>Sales from free-book readers</span><b>{s ? inr(s.revenueFromSubscribersInr) : "—"}</b><small>{s ? `${s.withAccount} created an account` : ""}</small></div>
        <div><span>All paying customers</span><b>{s ? s.customers : "—"}</b><small>{s ? `${inr(s.totalRevenueInr)} total sales` : ""}</small></div>
      </div>

      <div className="aud-row">
        <section className="aud-card aud-chart">
          <h3>Sign-ups per day <small>last 30 days</small></h3>
          <div className="aud-bars" onMouseLeave={() => setHover(null)} role="img" aria-label="Free-book sign-ups per day for the last 30 days">
            {(data?.daily || []).map((d, i) => (
              <div key={d.date} className="aud-bar-slot" onMouseEnter={() => setHover(i)}>
                <div className="aud-bar" style={{ height: `${(d.count / max) * 100}%`, opacity: hover === null || hover === i ? 1 : 0.45 }} />
              </div>
            ))}
            {hover !== null && data ? (
              <div className="aud-tip" style={{ left: `${((hover + 0.5) / data.daily.length) * 100}%` }}>
                <b>{new Date(data.daily[hover].date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</b>
                {data.daily[hover].count} sign-up{data.daily[hover].count === 1 ? "" : "s"}
              </div>
            ) : null}
          </div>
          <div className="aud-axis"><span>{data?.daily[0] ? date(data.daily[0].date) : ""}</span><span>Today</span></div>
        </section>
        <section className="aud-card">
          <h3>Where sign-ups came from</h3>
          <ul className="aud-sources">
            {Object.entries(s?.bySource || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k}><span>{SOURCE_LABEL[k] || k}</span><b>{v}</b></li>
            ))}
            {s && !Object.keys(s.bySource).length ? <li className="muted">No sign-ups yet.</li> : null}
          </ul>
        </section>
      </div>

      <section className="aud-card">
        <div className="aud-tools">
          <div className="aud-tabs">
            <button className={tab === "signups" ? "on" : ""} onClick={() => setTab("signups")}>Free-book sign-ups ({data?.signups.length ?? 0})</button>
            <button className={tab === "customers" ? "on" : ""} onClick={() => setTab("customers")}>Paying customers ({data?.customers.length ?? 0})</button>
          </div>
          <div className="aud-tools-r">
            {tab === "signups" ? (
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter">
                <option value="all">All</option>
                <option value="customers">Bought a book</option>
                <option value="not">Not bought yet</option>
              </select>
            ) : null}
            <input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => {
              if (tab === "signups") download("free-book-signups.csv", toCsv([["Name", "Email", "Source", "Signed up", "Has account", "Bought a book", "Orders", "Spent (INR)", "Unsubscribed"], ...signups.map((r) => [r.name, r.email, SOURCE_LABEL[r.source] || r.source, new Date(r.signedUpAt).toISOString().slice(0, 10), r.hasAccount ? "Yes" : "No", r.customer ? "Yes" : "No", r.orders, r.spentInr, r.unsubscribed ? "Yes" : "No"])]));
              else download("customers.csv", toCsv([["Name", "Email", "Orders", "Books", "Spent (INR)", "First purchase", "Last purchase", "Currencies", "Free-book subscriber", "Referred by a friend"], ...customers.map((r) => [r.name, r.email, r.orders, r.books, r.spentInr, date(r.firstPurchase), date(r.lastPurchase), r.currencies.join(" "), r.freeBookSubscriber ? "Yes" : "No", r.referred ? "Yes" : "No"])]));
            }}>Download CSV</button>
          </div>
        </div>

        <div className="aud-table-wrap">
          {tab === "signups" ? (
            <table className="aud-table">
              <thead><tr><th>Name</th><th>Email</th><th>Source</th><th>Signed up</th><th>Account</th><th>Bought?</th><th className="num">Spent</th></tr></thead>
              <tbody>
                {signups.map((r) => (
                  <tr key={r.email}>
                    <td>{r.name || <span className="muted">—</span>}</td>
                    <td><a href={`mailto:${r.email}`}>{r.email}</a>{r.unsubscribed ? <span className="aud-pill off">unsubscribed</span> : null}</td>
                    <td>{SOURCE_LABEL[r.source] || r.source}</td>
                    <td>{date(r.signedUpAt)}</td>
                    <td>{r.hasAccount ? "Yes" : <span className="muted">No</span>}</td>
                    <td>{r.customer ? <span className="aud-pill good">Customer</span> : <span className="muted">Not yet</span>}</td>
                    <td className="num">{r.spentInr ? inr(r.spentInr) : "—"}</td>
                  </tr>
                ))}
                {!signups.length ? <tr><td colSpan={7} className="muted">{loading ? "Loading…" : "No sign-ups match."}</td></tr> : null}
              </tbody>
            </table>
          ) : (
            <table className="aud-table">
              <thead><tr><th>Name</th><th>Email</th><th className="num">Orders</th><th className="num">Books</th><th className="num">Spent</th><th>Last purchase</th><th>Tags</th></tr></thead>
              <tbody>
                {customers.map((r) => (
                  <tr key={r.email}>
                    <td>{r.name || <span className="muted">—</span>}</td>
                    <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td className="num">{r.orders}</td>
                    <td className="num">{r.books}</td>
                    <td className="num"><b>{inr(r.spentInr)}</b></td>
                    <td>{date(r.lastPurchase)}</td>
                    <td>
                      {r.freeBookSubscriber ? <span className="aud-pill">Free book</span> : null}
                      {r.referred ? <span className="aud-pill">Referred</span> : null}
                      {r.currencies.filter((c) => c !== "INR").map((c) => <span key={c} className="aud-pill">{c}</span>)}
                    </td>
                  </tr>
                ))}
                {!customers.length ? <tr><td colSpan={7} className="muted">{loading ? "Loading…" : "No customers yet."}</td></tr> : null}
              </tbody>
            </table>
          )}
        </div>
        <p className="muted" style={{ fontSize: ".82rem", marginTop: ".75rem" }}>
          This is private customer data — keep downloaded files safe, and only email people who signed up (always include a way to unsubscribe).
        </p>
      </section>
    </main>
  );
}
