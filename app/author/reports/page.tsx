"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StudioShell, { useStudio } from "@/components/studio/StudioShell";
import { inr } from "@/lib/publishing";

type Report = {
  totals: { units: number; gross: number; fees: number; royalties: number; pending: number; settled: number };
  series: { date: string; units: number; royalties: number; gross: number }[];
  titles: { bookId: number; title: string; units: number; gross: number; royalties: number; bundleUnits: number }[];
  orders: { date: string; bookId: number; title: string; gross: number; fee: number; royalty: number; status: string; bundle: boolean }[];
};

const RANGES = [
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "365", label: "12 months" },
  { id: "all", label: "All time" },
];

export default function ReportsPage() {
  return (
    <StudioShell>
      <Reports />
    </StudioShell>
  );
}

function Reports() {
  const { token } = useStudio();
  const [range, setRange] = useState("30");
  const [book, setBook] = useState("");
  const [metric, setMetric] = useState<"royalties" | "units">("royalties");
  const [report, setReport] = useState<Report | null>(null);
  const [allTitles, setAllTitles] = useState<{ bookId: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({ range, ...(book ? { book } : {}) });
    fetch(`/api/author/reports?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "Could not load reports"); return j; })
      .then((j: Report) => {
        if (!alive) return;
        setReport(j);
        if (!book) setAllTitles((prev) => {
          const m = new Map(prev.map((t) => [t.bookId, t]));
          j.titles.forEach((t) => m.set(t.bookId, { bookId: t.bookId, title: t.title }));
          return Array.from(m.values());
        });
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [range, book, token]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [["Date", "Title", "Sale price (INR)", "Platform fee (INR)", "Royalty (INR)", "Bundle", "Payout status"]];
    report.orders.forEach((o) => rows.push([
      new Date(o.date).toISOString().slice(0, 10), o.title, String(o.gross), String(o.fee), String(o.royalty), o.bundle ? "Yes" : "No", o.status,
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `royalties-${range}${book ? `-book${book}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const t = report?.totals;
  const avg = t && t.units ? t.royalties / t.units : 0;

  return (
    <>
      <div className="studio-head">
        <div>
          <h1>Reports</h1>
          <p>Sales and royalties for your books. Every sale appears here as soon as payment is confirmed.</p>
        </div>
        <button className="s-btn" onClick={exportCsv} disabled={!report || !report.orders.length}>Download CSV</button>
      </div>

      <div className="rep-filters">
        <div className="s-chips">
          {RANGES.map((r) => (
            <button key={r.id} className={`s-chip ${range === r.id ? "on" : ""}`} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
        <select className="s-select" style={{ width: "auto", minWidth: 200, height: 34 }} value={book} onChange={(e) => setBook(e.target.value)} aria-label="Filter by title">
          <option value="">All titles</option>
          {allTitles.map((x) => <option key={x.bookId} value={x.bookId}>{x.title}</option>)}
        </select>
      </div>

      {error ? <div className="s-alert s-alert-bad"><div className="s-alert-body">{error}</div></div> : null}

      <div className="s-kpis">
        <Kpi label="Royalties earned" value={t ? inr(t.royalties, 2) : "—"} note={t ? `${inr(avg, 2)} average per sale` : ""} />
        <Kpi label="Copies sold" value={t ? String(t.units) : "—"} note={t && t.units ? `${report?.titles.length} title${report?.titles.length === 1 ? "" : "s"}` : ""} />
        <Kpi label="Gross sales" value={t ? inr(t.gross, 2) : "—"} note={t ? `Platform fees ${inr(t.fees, 2)}` : ""} />
        <Kpi label="Awaiting payout" value={t ? inr(t.pending, 2) : "—"} note={t ? `${inr(t.settled, 2)} already paid` : ""} />
      </div>

      <div className="s-card" style={{ marginBottom: "1.25rem" }}>
        <div className="shelf-tools" style={{ justifyContent: "space-between" }}>
          <div>
            <h3 className="s-card-title">{metric === "royalties" ? "Royalties per day" : "Copies sold per day"}</h3>
            <div className="s-sub">{RANGES.find((r) => r.id === range)?.label}{book ? ` · ${allTitles.find((x) => String(x.bookId) === book)?.title || ""}` : " · all titles"}</div>
          </div>
          <div className="s-chips">
            <button className={`s-chip ${metric === "royalties" ? "on" : ""}`} onClick={() => setMetric("royalties")}>Royalties</button>
            <button className={`s-chip ${metric === "units" ? "on" : ""}`} onClick={() => setMetric("units")}>Copies</button>
          </div>
        </div>
        {loading && !report ? <div className="s-empty"><p>Loading…</p></div> : report && report.totals.units === 0 ? (
          <div className="s-empty">
            <h3>No sales in this period</h3>
            <p>Share your book’s store page with readers — sales will show up here the moment they happen.</p>
          </div>
        ) : report ? <BarChart series={report.series} metric={metric} /> : null}
      </div>

      <div className="two-col">
        <div className="s-card">
          <div className="shelf-tools"><h3 className="s-card-title">By title</h3></div>
          <div className="s-table-wrap">
            <table className="s-table">
              <thead><tr><th>Title</th><th className="num">Copies</th><th className="num">Gross</th><th className="num">Royalties</th></tr></thead>
              <tbody>
                {report?.titles.length ? report.titles.map((x) => (
                  <tr key={x.bookId}>
                    <td className="ttl">{x.title}{x.bundleUnits ? <div className="s-sub">{x.bundleUnits} via bundles</div> : null}</td>
                    <td className="num">{x.units}</td><td className="num">{inr(x.gross, 2)}</td><td className="num"><b>{inr(x.royalties, 2)}</b></td>
                  </tr>
                )) : <tr><td colSpan={4} className="s-sub">No sales yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="s-card">
          <div className="shelf-tools"><h3 className="s-card-title">Recent sales</h3></div>
          <div className="s-table-wrap">
            <table className="s-table">
              <thead><tr><th>Date</th><th>Title</th><th className="num">Royalty</th><th>Payout</th></tr></thead>
              <tbody>
                {report?.orders.length ? report.orders.slice(0, 25).map((o, i) => (
                  <tr key={i}>
                    <td>{new Date(o.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="ttl">{o.title}{o.bundle ? <span className="s-sub"> · bundle</span> : null}</td>
                    <td className="num">{inr(o.royalty, 2)}</td>
                    <td><span className={`s-pill ${o.status === "settled" ? "tone-good" : o.status === "on_hold" ? "tone-warn" : "tone-neutral"}`}>{o.status === "settled" ? "Paid" : o.status === "on_hold" ? "On hold" : "Pending"}</span></td>
                  </tr>
                )) : <tr><td colSpan={4} className="s-sub">No sales yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="s-kpi">
      <div className="s-kpi-label">{label}</div>
      <div className="s-kpi-value">{value}</div>
      {note ? <div className="s-kpi-note">{note}</div> : null}
    </div>
  );
}

const BAR = "#b7791f"; // validated single-series hue (lightness, chroma and 3:1 contrast on white)

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function BarChart({ series, metric }: { series: Report["series"]; metric: "royalties" | "units" }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth - 32));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Long ranges are grouped by week so bars stay readable.
  const data = useMemo(() => {
    if (series.length <= 62) return series.map((s) => ({ label: s.date, from: s.date, to: s.date, v: s[metric], units: s.units, royalties: s.royalties }));
    const out: { label: string; from: string; to: string; v: number; units: number; royalties: number }[] = [];
    for (let i = 0; i < series.length; i += 7) {
      const chunk = series.slice(i, i + 7);
      const units = chunk.reduce((a, b) => a + b.units, 0);
      const royalties = chunk.reduce((a, b) => a + b.royalties, 0);
      out.push({ label: chunk[0].date, from: chunk[0].date, to: chunk[chunk.length - 1].date, v: metric === "units" ? units : royalties, units, royalties });
    }
    return out;
  }, [series, metric]);

  const H = 240, padL = 48, padB = 26, padT = 10;
  const max = niceMax(Math.max(...data.map((d) => d.v)));
  const plotW = Math.max(100, w - padL);
  const slot = plotW / data.length;
  const bw = Math.min(24, Math.max(2, slot - 2));
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const fmt = (v: number) => (metric === "units" ? String(Math.round(v)) : inr(v));
  const dLabel = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const every = Math.ceil(data.length / 8);
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="chart-box" ref={box}>
      <svg viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`${metric} per ${series.length > 62 ? "week" : "day"}`} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke="#ece7dd" strokeWidth={1} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8a847b">{fmt(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const top = y(d.v);
          const height = Math.max(0, H - padB - top);
          const r = Math.min(4, bw / 2, height);
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={padL + i * slot} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              {height > 0 ? (
                <path
                  d={`M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${H - padB} Z`}
                  fill={BAR}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              ) : null}
              {i % every === 0 ? <text x={padL + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#8a847b">{dLabel(d.label)}</text> : null}
            </g>
          );
        })}
        <line x1={padL} x2={w} y1={H - padB} y2={H - padB} stroke="#d9d3c7" strokeWidth={1} />
      </svg>
      {h && hover !== null ? (
        <div className="chart-tip" style={{ left: 16 + padL + hover * slot + slot / 2, top: y(h.v) + 8 }}>
          <b>{h.from === h.to ? dLabel(h.from) : `${dLabel(h.from)} – ${dLabel(h.to)}`}</b>
          {inr(h.royalties, 2)} royalties · {h.units} {h.units === 1 ? "copy" : "copies"}
        </div>
      ) : null}
    </div>
  );
}
