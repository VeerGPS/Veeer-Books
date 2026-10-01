"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { trackMarketplaceEvent } from "@/lib/analytics";

type Data = {
  code: string;
  enabled?: boolean;
  friendPercent: number;
  rewardPercent: number;
  rewardDays: number;
  friends: number;
  rewards: { code: string; percent: number; used: boolean; expired: boolean; expiresAt?: string }[];
};

export default function ReferPage() {
  const { isLoggedIn, isReady, token } = useAuth();
  const { show } = useModal();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!isReady || !token) return;
    fetch("/api/referrals", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; })
      .then(setData)
      .catch((e) => setErr(e.message || "Could not load your link"));
  }, [isReady, token]);

  const link = data && typeof window !== "undefined" ? `${window.location.origin}/?ref=${data.code}` : "";
  const msg = data ? `I’ve been reading great eBooks on Veeer Sukhadiya Books. Use my link to get ${data.friendPercent}% off your first book: ${link}` : "";
  const enc = encodeURIComponent;

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(""), 2000); } catch { /* ignore */ }
  };
  const nativeShare = async () => {
    trackMarketplaceEvent("referral_link_shared");
    try { if (navigator.share) await navigator.share({ title: "Veeer Sukhadiya Books", text: msg, url: link }); else copy(link, "link"); } catch { /* cancelled */ }
  };

  return (
    <main className="refer">
      <section className="container refer-wrap">
        <span className="refer-eyebrow">Refer &amp; earn</span>
        {data && data.enabled === false ? <p className="cart-note" style={{ marginBottom: "1rem" }}>The refer-a-friend programme is paused right now — check back soon.</p> : null}
        <h1>Give {data?.friendPercent ?? 10}%, get {data?.rewardPercent ?? 15}%</h1>
        <p className="refer-lead">Share your link. Friends get <b>{data?.friendPercent ?? 10}% off their first book</b>, and every time one of them buys, you get a <b>{data?.rewardPercent ?? 15}% off coupon</b> for your next read.</p>

        {!isReady ? null : !isLoggedIn ? (
          <div className="refer-card">
            <h3>Sign in to get your personal link</h3>
            <p className="muted">It takes a few seconds, and your link works forever.</p>
            <div className="refer-actions">
              <button className="btn btn-primary" onClick={() => show("signup")}>Create free account</button>
              <button className="btn btn-outline" onClick={() => show("login")}>Sign in</button>
            </div>
          </div>
        ) : err ? (
          <div className="refer-card"><p style={{ color: "#b91c1c" }}>{err}</p></div>
        ) : !data ? (
          <div className="refer-card"><p className="muted">Loading your link…</p></div>
        ) : (
          <>
            <div className="refer-card">
              <label className="refer-label" htmlFor="ref-link">Your referral link</label>
              <div className="refer-link-row">
                <input id="ref-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                <button className="btn btn-primary" onClick={() => copy(link, "link")}>{copied === "link" ? "Copied!" : "Copy link"}</button>
              </div>
              <p className="muted refer-code">Or share your code: <b>{data.code}</b> <button className="linklike" onClick={() => copy(data.code, "code")}>{copied === "code" ? "copied" : "copy"}</button></p>
              <div className="refer-share">
                <a className="share-chip" target="_blank" rel="noopener noreferrer" onClick={() => trackMarketplaceEvent("referral_link_shared")} href={`https://wa.me/?text=${enc(msg)}`}>WhatsApp</a>
                <a className="share-chip" target="_blank" rel="noopener noreferrer" onClick={() => trackMarketplaceEvent("referral_link_shared")} href={`https://t.me/share/url?url=${enc(link)}&text=${enc(msg)}`}>Telegram</a>
                <a className="share-chip" target="_blank" rel="noopener noreferrer" onClick={() => trackMarketplaceEvent("referral_link_shared")} href={`https://twitter.com/intent/tweet?text=${enc(msg)}`}>X</a>
                <a className="share-chip" target="_blank" rel="noopener noreferrer" onClick={() => trackMarketplaceEvent("referral_link_shared")} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`}>Facebook</a>
                <button className="share-chip" onClick={nativeShare}>More…</button>
              </div>
            </div>

            <div className="refer-stats">
              <div><b>{data.friends}</b><span>friend{data.friends === 1 ? "" : "s"} bought a book</span></div>
              <div><b>{data.rewards.filter((r) => !r.used && !r.expired).length}</b><span>reward coupon{data.rewards.filter((r) => !r.used && !r.expired).length === 1 ? "" : "s"} ready to use</span></div>
            </div>

            <div className="refer-card">
              <h3>Your rewards</h3>
              {data.rewards.length ? (
                <ul className="refer-rewards">
                  {data.rewards.map((r) => (
                    <li key={r.code} className={r.used || r.expired ? "off" : ""}>
                      <code>{r.code}</code>
                      <span>{r.percent}% off · {r.used ? "used" : r.expired ? "expired" : `valid until ${r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}`}</span>
                      {!r.used && !r.expired ? <button className="linklike" onClick={() => copy(r.code, r.code)}>{copied === r.code ? "copied" : "copy"}</button> : null}
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">No rewards yet — your first one arrives when a friend buys through your link.</p>}
              <p className="muted" style={{ fontSize: ".85rem", marginTop: ".75rem" }}>Enter a reward code in the cart. Each coupon works once, on your account, for {data.rewardDays} days.</p>
            </div>
          </>
        )}

        <div className="refer-how">
          <div><span>1</span><b>Share your link</b><p>Send it on WhatsApp, Instagram or anywhere your friends are.</p></div>
          <div><span>2</span><b>Friend saves {data?.friendPercent ?? 10}%</b><p>Their discount is applied automatically on their first order.</p></div>
          <div><span>3</span><b>You get {data?.rewardPercent ?? 15}% off</b><p>A reward coupon lands in your inbox and on this page.</p></div>
        </div>
        <p className="muted" style={{ textAlign: "center", marginTop: "1.5rem" }}><Link href="/#collection">Browse books</Link></p>
      </section>
    </main>
  );
}
