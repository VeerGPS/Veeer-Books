"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { trackMarketplaceEvent } from "@/lib/analytics";
import { inr, royaltyFor } from "@/lib/publishing";
import "./publish.css";

const FEE = 15;
const MIN = 49;
const MAX = 9999;

const STEPS = [
  { n: "1", t: "Enter your book details", d: "Title, description, categories and keywords — with live tips so readers can find you." },
  { n: "2", t: "Upload manuscript & cover", d: "PDF, DOCX or EPUB plus your cover. We check size and format as you upload." },
  { n: "3", t: "Set your price", d: "Choose any price and see exactly what you earn per sale before you publish." },
  { n: "4", t: "Go live", d: "Our editors review, convert and quality-check your book, then it’s in the store." },
];

const FEATURES = [
  { t: "Keep your rights", d: "You grant a non-exclusive licence. Your copyright stays yours, and you can publish anywhere else too." },
  { t: `${100 - FEE}% royalty`, d: `You earn ${100 - FEE}% of the list price on every copy. No setup fees, no monthly charges.` },
  { t: "A beautiful reader", d: "Every book is converted into our reader — bookmarks, highlights, notes, search and dark mode, on any device." },
  { t: "Live sales reports", d: "See every sale as it happens, by day and by title, and export it to a spreadsheet." },
  { t: "Direct payouts", d: "Paid on the last day of every month, straight to your bank account or UPI, with a clear payout history." },
  { t: "Real people reviewing", d: "Every submission is read by our team. If something needs fixing, you get specific notes — not a form rejection." },
];

const FAQ: [string, string][] = [
  ["What does it cost?", `Nothing to publish. We take a ${FEE}% platform fee only when a copy sells — that covers payments, hosting, the reader and support.`],
  ["Who owns my book?", "You do. The licence is non-exclusive, so you keep your copyright and can sell your book anywhere else at the same time."],
  ["What formats can I upload?", "Manuscripts as PDF, DOCX, DOC, EPUB, RTF or TXT (up to 50 MB). Covers as JPG, PNG or WebP (up to 10 MB)."],
  ["Do I need an ISBN?", "No. It’s optional for digital books on Veeer Books."],
  ["How do I get paid?", "Add a bank account or UPI ID in Author Studio. Every author is paid on the last day of each month (the 30th or 31st), straight to that account."],
  ["Can I change my book after publishing?", "Yes — update the price, description or upload a new version from your Bookshelf. Changes go through a quick review."],
];

function snap(v: number) {
  const p = v < 1000 ? Math.round(v / 10) * 10 - 1 : Math.round(v / 100) * 100 - 1;
  return Math.min(MAX, Math.max(MIN, p));
}

export default function PublishLandingPage() {
  const router = useRouter();
  const { isLoggedIn, token, isReady } = useAuth();
  const { show } = useModal();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [price, setPrice] = useState(199);

  useEffect(() => { trackMarketplaceEvent("publish_page_view"); }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn || !token) { setHasProfile(null); return; }
    fetch("/api/author/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated === false) { localStorage.removeItem("auth_token"); setHasProfile(false); return; }
        setHasProfile(Boolean(d?.profile));
      })
      .catch(() => setHasProfile(false));
  }, [isLoggedIn, token, isReady]);

  const start = () => {
    trackMarketplaceEvent("author_registration_started");
    if (!isLoggedIn) return show("signup");
    router.push(hasProfile ? "/author/publish/new" : "/author/setup");
  };

  const ctaLabel = isLoggedIn && hasProfile ? "Create a new title" : "Start publishing — it’s free";
  const r = royaltyFor(price, FEE);
  const pos = Math.round(((Math.log(Math.max(MIN, price)) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN))) * 1000);

  return (
    <main className="pub">
      <section className="pub-hero">
        <div className="pub-wrap pub-hero-grid">
          <div>
            <span className="pub-eyebrow">Veeer Books · Author Studio</span>
            <h1>Publish your book. Reach readers. Keep {100 - FEE}%.</h1>
            <p className="pub-lead">Upload your manuscript, set your price and go live in our store — with a professional reader, real-time sales reports and direct payouts. Free to publish, and your rights stay yours.</p>
            <div className="pub-cta-row">
              <button className="pub-btn pub-btn-primary" onClick={start}>{ctaLabel}</button>
              {isLoggedIn && hasProfile
                ? <Link href="/author/dashboard" className="pub-btn">Go to your Bookshelf</Link>
                : <a href="#how" className="pub-btn">See how it works</a>}
            </div>
            <ul className="pub-ticks">
              <li>No upfront costs</li><li>Non-exclusive</li><li>Paid on the last day of every month</li>
            </ul>
          </div>
          <div className="pub-mock" aria-hidden="true">
            <div className="pub-mock-bar"><i /><i /><i /><span>Author Studio · Bookshelf</span></div>
            <div className="pub-mock-body">
              <div className="pub-mock-kpis">
                <div><small>Royalties · 30 days</small><b>₹ ——</b></div>
                <div><small>Copies sold</small><b>——</b></div>
              </div>
              <div className="pub-mock-bars">
                {[30, 42, 28, 55, 48, 62, 40, 70, 58, 76, 66, 88].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
              </div>
              {[["Live", "good"], ["In review", "info"], ["Draft", "neutral"]].map(([s, tone], i) => (
                <div className="pub-mock-row" key={s}>
                  <div className={`pub-mock-cover c${i}`} />
                  <div className="pub-mock-lines"><span /><span /></div>
                  <em className={`tone-${tone}`}>{s}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="pub-sec">
        <div className="pub-wrap">
          <h2>From manuscript to store in four steps</h2>
          <p className="pub-sub">A guided setup saves as you go. Leave any time and pick up where you left off.</p>
          <ol className="pub-steps">
            {STEPS.map((s) => (
              <li key={s.n}><span className="pub-step-n">{s.n}</span><h3>{s.t}</h3><p>{s.d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pub-sec pub-sec-alt">
        <div className="pub-wrap pub-calc-grid">
          <div>
            <h2>See what you’ll earn</h2>
            <p className="pub-sub">Pick a price between {inr(MIN)} and {inr(MAX)}. You keep {100 - FEE}% of every sale, and you can change the price whenever you like.</p>
            <ul className="pub-ticks pub-ticks-col">
              <li>Royalty is recorded the moment a reader pays</li>
              <li>Paid on the last day of every month</li>
              <li>Bundle sales pay your share of the bundle price</li>
              <li>A free preview helps readers decide to buy</li>
            </ul>
          </div>
          <div className="pub-calc">
            <label htmlFor="pub-price">List price</label>
            <div className="pub-calc-price">
              <span>₹</span>
              <input
                id="pub-price" type="number" min={MIN} max={MAX} value={price || ""}
                onChange={(e) => setPrice(Math.min(MAX, Math.max(0, Math.round(Number(e.target.value)) || 0)))}
                onBlur={() => setPrice((p) => Math.min(MAX, Math.max(MIN, p)))}
              />
            </div>
            <input
              className="pub-range" type="range" min={0} max={1000} aria-label="Price slider" value={pos}
              onChange={(e) => setPrice(snap(Math.exp(Math.log(MIN) + (Number(e.target.value) / 1000) * (Math.log(MAX) - Math.log(MIN)))))}
            />
            <div className="pub-calc-rows">
              <div><span>Platform fee ({FEE}%)</span><span>− {inr(r.fee, 2)}</span></div>
              <div className="pub-calc-earn"><span>You earn per copy</span><b>{inr(r.earn, 2)}</b></div>
              <div><span>100 copies</span><span>{inr(r.earn * 100)}</span></div>
              <div><span>1,000 copies</span><span>{inr(r.earn * 1000)}</span></div>
            </div>
            {price < MIN ? <p className="pub-warn">Minimum price is {inr(MIN)}.</p> : null}
          </div>
        </div>
      </section>

      <section className="pub-sec">
        <div className="pub-wrap">
          <h2>Everything an independent author needs</h2>
          <div className="pub-features">
            {FEATURES.map((f) => <div key={f.t} className="pub-feature"><h3>{f.t}</h3><p>{f.d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="pub-sec pub-sec-alt">
        <div className="pub-wrap pub-faq-wrap">
          <h2>Questions authors ask</h2>
          <div className="pub-faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
          <p className="pub-sub" style={{ marginTop: "1rem" }}>
            Read the full <Link href="/author/help">publishing guide</Link> or the <Link href="/author/account#agreement">publishing agreement</Link>.
          </p>
        </div>
      </section>

      <section className="pub-final">
        <div className="pub-wrap">
          <h2>Your readers are waiting.</h2>
          <p>Set up your author profile in two minutes and start your first title today.</p>
          <button className="pub-btn pub-btn-primary" onClick={start}>{ctaLabel}</button>
        </div>
      </section>
    </main>
  );
}
