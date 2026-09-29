"use client";

import { useEffect, useMemo, useState } from "react";
import StudioShell, { useStudio } from "@/components/studio/StudioShell";
import { inr, payoutDateLabel } from "@/lib/publishing";

type Order = { date: string; title: string; royalty: number; status: string; settledAt?: string; reference?: string };

export default function PaymentsPage() {
  return (
    <StudioShell>
      <Payments />
    </StudioShell>
  );
}

function mask(v?: string) {
  if (!v) return "";
  const s = v.replace(/\s+/g, "");
  return s.length <= 4 ? s : `•••• ${s.slice(-4)}`;
}

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const UPI = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;

function Payments() {
  const { data, token, reload, toast } = useStudio();
  const pay = data.profile?.paymentSettlementInfo || {};
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [totals, setTotals] = useState<{ pending: number; settled: number; royalties: number } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/author/reports?range=all", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { setOrders(j.orders || []); setTotals(j.totals); })
      .catch(() => { setOrders([]); });
  }, [token]);

  const onHold = useMemo(() => (orders || []).filter((o) => o.status === "on_hold").reduce((a, b) => a + b.royalty, 0), [orders]);

  // Group settled royalties into payouts by their settlement reference.
  const payouts = useMemo(() => {
    const m = new Map<string, { ref: string; date: string; amount: number; count: number }>();
    (orders || []).filter((o) => o.status === "settled").forEach((o) => {
      const ref = o.reference || `Payout ${o.settledAt ? new Date(o.settledAt).toISOString().slice(0, 10) : ""}`;
      const p = m.get(ref) || { ref, date: o.settledAt || o.date, amount: 0, count: 0 };
      p.amount += o.royalty;
      p.count += 1;
      if (o.settledAt && new Date(o.settledAt) > new Date(p.date)) p.date = o.settledAt;
      m.set(ref, p);
    });
    return Array.from(m.values()).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [orders]);

  const hasMethod = Boolean((pay.accountNumber && pay.ifscCode) || pay.upiId);

  return (
    <>
      <div className="studio-head">
        <div>
          <h1>Payments</h1>
          <p>Royalties are paid on the <b>last day of every month</b>. Your next payout is on <b>{payoutDateLabel()}</b>.</p>
        </div>
      </div>

      {!hasMethod ? (
        <div className="s-alert s-alert-warn">
          <div className="s-alert-body"><b>Add a payout method to get paid.</b> Royalties keep adding up safely, but we can’t send them until we know where to pay you.</div>
          <button className="s-btn s-btn-sm" onClick={() => setEditing(true)}>Add payout method</button>
        </div>
      ) : null}

      <div className="s-kpis">
        <div className="s-kpi"><div className="s-kpi-label">Next payout · {payoutDateLabel().replace(/ \d{4}$/, "")}</div><div className="s-kpi-value">{totals ? inr(Math.max(0, totals.pending - onHold), 2) : "—"}</div><div className="s-kpi-note">Estimated · pending royalties</div></div>
        <div className="s-kpi"><div className="s-kpi-label">On hold</div><div className="s-kpi-value">{orders ? inr(onHold, 2) : "—"}</div><div className="s-kpi-note">Refunds or checks in progress</div></div>
        <div className="s-kpi"><div className="s-kpi-label">Paid to date</div><div className="s-kpi-value">{totals ? inr(totals.settled, 2) : "—"}</div><div className="s-kpi-note">{payouts.length} payout{payouts.length === 1 ? "" : "s"}</div></div>
        <div className="s-kpi"><div className="s-kpi-label">Lifetime royalties</div><div className="s-kpi-value">{totals ? inr(totals.royalties, 2) : "—"}</div><div className="s-kpi-note">All sales, all titles</div></div>
      </div>

      <div className="two-col">
        <div className="s-card">
          <div className="shelf-tools"><h3 className="s-card-title">Payout history</h3></div>
          <div className="s-table-wrap">
            <table className="s-table">
              <thead><tr><th>Date</th><th>Reference</th><th className="num">Sales</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {orders === null ? <tr><td colSpan={4} className="s-sub">Loading…</td></tr>
                  : payouts.length ? payouts.map((p) => (
                    <tr key={p.ref}>
                      <td>{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>{p.ref}</td><td className="num">{p.count}</td><td className="num"><b>{inr(p.amount, 2)}</b></td>
                    </tr>
                  )) : <tr><td colSpan={4} className="s-sub">No payouts yet. Your first payout is sent on {payoutDateLabel()}, if you have pending royalties by then.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="s-card s-card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 className="s-card-title" style={{ margin: 0 }}>Payout method</h3>
            {!editing ? <button className="s-btn s-btn-sm" onClick={() => setEditing(true)}>{hasMethod ? "Edit" : "Add"}</button> : null}
          </div>
          {editing ? (
            <PayoutForm
              initial={pay}
              onCancel={() => setEditing(false)}
              onSave={async (info) => {
                const res = await fetch("/api/author/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ penName: data.profile.penName, paymentSettlementInfo: info }),
                });
                const j = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(j.error || "Could not save payout details");
                await reload();
                setEditing(false);
                toast("Payout details saved");
              }}
            />
          ) : hasMethod ? (
            <ul className="s-list">
              {pay.accountNumber ? <li><div className="t">Bank transfer</div><div className="d">{pay.bankName || "Bank account"} · {mask(pay.accountNumber)} · {pay.ifscCode}</div><div className="d">{pay.accountHolderName}</div></li> : null}
              {pay.upiId ? <li><div className="t">UPI</div><div className="d">{pay.upiId}</div></li> : null}
              <li><div className="t">Tax (PAN)</div><div className="d">{pay.panOrTaxNumber ? mask(pay.panOrTaxNumber) : "Not added — TDS may be deducted at a higher rate"}</div></li>
            </ul>
          ) : (
            <p className="s-muted" style={{ fontSize: "0.9rem" }}>Add a bank account or UPI ID. Your details are only used to send royalties and are never shown to readers.</p>
          )}
        </div>
      </div>

      <div className="s-card s-card-pad" style={{ marginTop: "1.25rem" }}>
        <h3 className="s-card-title">How payouts work</h3>
        <ul className="s-list">
          <li><div className="t">1 · A reader buys your book</div><div className="d">Your royalty is recorded instantly and shows as <i>Pending</i> in Reports.</div></li>
          <li><div className="t">2 · Sales are checked</div><div className="d">Each sale is checked for refunds and payment disputes. Anything under review is marked <i>On hold</i>.</div></li>
          <li><div className="t">3 · You get paid</div><div className="d">On the last day of every month (30th or 31st), all pending royalties are sent to your payout method and appear above with a reference number.</div></li>
        </ul>
      </div>
    </>
  );
}

function PayoutForm({ initial, onCancel, onSave }: { initial: any; onCancel: () => void; onSave: (info: any) => Promise<void> }) {
  const [f, setF] = useState({
    accountHolderName: initial.accountHolderName || "",
    bankName: initial.bankName || "",
    accountNumber: "",
    confirmAccount: "",
    ifscCode: initial.ifscCode || "",
    upiId: initial.upiId || "",
    panOrTaxNumber: initial.panOrTaxNumber || "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const ifsc = f.ifscCode.trim().toUpperCase();
    const pan = f.panOrTaxNumber.trim().toUpperCase();
    const acct = f.accountNumber.replace(/\s+/g, "");
    const keepAcct = !acct && initial.accountNumber;
    if (!acct && !keepAcct && !f.upiId.trim()) return setErr("Add a bank account or a UPI ID.");
    if (acct) {
      if (!/^\d{9,18}$/.test(acct)) return setErr("Account number should be 9–18 digits.");
      if (acct !== f.confirmAccount.replace(/\s+/g, "")) return setErr("Account numbers don’t match.");
    }
    if ((acct || keepAcct) && !IFSC.test(ifsc)) return setErr("Enter a valid 11-character IFSC code (e.g. HDFC0001234).");
    if ((acct || keepAcct) && !f.accountHolderName.trim()) return setErr("Enter the account holder’s name.");
    if (f.upiId.trim() && !UPI.test(f.upiId.trim())) return setErr("Enter a valid UPI ID (e.g. name@okhdfc).");
    if (pan && !PAN.test(pan)) return setErr("Enter a valid PAN (e.g. ABCDE1234F).");
    const info: any = {
      accountHolderName: f.accountHolderName.trim(),
      bankName: f.bankName.trim(),
      ifscCode: ifsc,
      upiId: f.upiId.trim(),
      panOrTaxNumber: pan,
    };
    if (acct) info.accountNumber = acct;
    setBusy(true);
    try { await onSave(info); } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <div className="s-field"><label className="s-label">Account holder name</label><input className="s-input" value={f.accountHolderName} onChange={set("accountHolderName")} autoComplete="name" /></div>
      <div className="s-row">
        <div className="s-field"><label className="s-label">Bank name</label><input className="s-input" value={f.bankName} onChange={set("bankName")} /></div>
        <div className="s-field"><label className="s-label">IFSC code</label><input className="s-input" value={f.ifscCode} onChange={set("ifscCode")} style={{ textTransform: "uppercase" }} maxLength={11} /></div>
      </div>
      <div className="s-row">
        <div className="s-field"><label className="s-label">Account number</label><input className="s-input" value={f.accountNumber} onChange={set("accountNumber")} inputMode="numeric" autoComplete="off" placeholder={initial.accountNumber ? `Keep ${mask(initial.accountNumber)}` : ""} /></div>
        <div className="s-field"><label className="s-label">Confirm account number</label><input className="s-input" value={f.confirmAccount} onChange={set("confirmAccount")} inputMode="numeric" autoComplete="off" /></div>
      </div>
      <div className="s-row">
        <div className="s-field"><label className="s-label">UPI ID <span className="s-sub">(optional)</span></label><input className="s-input" value={f.upiId} onChange={set("upiId")} placeholder="name@bank" /></div>
        <div className="s-field"><label className="s-label">PAN</label><input className="s-input" value={f.panOrTaxNumber} onChange={set("panOrTaxNumber")} style={{ textTransform: "uppercase" }} maxLength={10} /></div>
      </div>
      {err ? <div className="s-alert s-alert-bad" style={{ margin: "0.5rem 0" }}><div className="s-alert-body">{err}</div></div> : null}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button className="s-btn s-btn-primary" disabled={busy}>{busy ? "Saving…" : "Save payout details"}</button>
        <button type="button" className="s-btn s-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
