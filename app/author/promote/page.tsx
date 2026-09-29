"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import StudioShell, { useStudio } from "@/components/studio/StudioShell";
import { absUrl } from "@/lib/site";
import { trackMarketplaceEvent } from "@/lib/analytics";

type LiveBook = { slug: string; title: string; author: string; cover?: string; price: number; genre?: string; description?: string };

export default function PromotePage() {
  return (
    <StudioShell>
      <Promote />
    </StudioShell>
  );
}

const FORMATS = [
  { id: "square", label: "Instagram / Facebook post", w: 1080, h: 1080 },
  { id: "story", label: "Story / WhatsApp status", w: 1080, h: 1920 },
  { id: "wide", label: "X / LinkedIn / YouTube", w: 1600, h: 900 },
] as const;

function Promote() {
  const { data } = useStudio();
  const books: LiveBook[] = useMemo(() => {
    const seen = new Set<string>();
    const out: LiveBook[] = [];
    for (const b of data.publishedBooks || []) {
      if (!b?.slug || seen.has(b.slug)) continue;
      seen.add(b.slug);
      out.push({ slug: b.slug, title: b.title, author: b.author || data.profile?.penName, cover: b.cover, price: b.sellingPrice || b.price, genre: b.genre, description: b.description });
    }
    return out;
  }, [data]);
  const [slug, setSlug] = useState(books[0]?.slug || "");
  const book = books.find((b) => b.slug === slug) || books[0];

  if (!book) {
    return (
      <>
        <div className="studio-head"><div><h1>Promote</h1><p>Ready-made images and posts for your live books.</p></div></div>
        <div className="s-card s-empty">
          <h3>No live books yet</h3>
          <p>Once your first book is live in the store, you’ll find share images, captions and a launch checklist here.</p>
          <Link href="/author/publish/new" className="s-btn s-btn-primary">Create a new title</Link>
        </div>
      </>
    );
  }

  const url = absUrl(`/product/${book.slug}`);
  return (
    <>
      <div className="studio-head">
        <div>
          <h1>Promote</h1>
          <p>Download share images and copy ready-made posts. Authors who share their book in the first week usually sell far more.</p>
        </div>
        {books.length > 1 ? (
          <select className="s-select" style={{ width: "auto", minWidth: 220 }} value={book.slug} onChange={(e) => setSlug(e.target.value)} aria-label="Choose a book">
            {books.map((b) => <option key={b.slug} value={b.slug}>{b.title}</option>)}
          </select>
        ) : null}
      </div>

      <div className="s-card s-card-pad" style={{ marginBottom: "1.25rem" }}>
        <h3 className="s-card-title">Your book link</h3>
        <CopyRow text={url} />
        <p className="s-sub" style={{ marginTop: ".5rem" }}>Readers can open the free preview straight from this page, which is the easiest way to turn a curious follower into a buyer.</p>
      </div>

      <h2 className="promo-h">Share images</h2>
      <div className="promo-grid">
        {FORMATS.map((f) => <ShareImage key={f.id + book.slug} book={book} format={f} />)}
      </div>

      <h2 className="promo-h">Ready-made posts</h2>
      <div className="two-col">
        {captions(book, url).map((c) => (
          <div className="s-card s-card-pad" key={c.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
              <h3 className="s-card-title" style={{ margin: 0 }}>{c.label}</h3>
              <CopyButton text={c.text} />
            </div>
            <pre className="promo-caption">{c.text}</pre>
            {c.share ? <a className="s-btn s-btn-sm" target="_blank" rel="noopener noreferrer" href={c.share} onClick={() => trackMarketplaceEvent("book_shared")}>Open {c.shareLabel}</a> : null}
          </div>
        ))}
      </div>

      <h2 className="promo-h">Launch week checklist</h2>
      <div className="s-card s-card-pad">
        <ul className="promo-check">
          {[
            "Post the square image on Instagram and Facebook with the caption above.",
            "Put the story image on your WhatsApp status and Instagram story, with the link sticker.",
            "Send the WhatsApp message to friends, family and groups that would enjoy the book.",
            "Pin the post on your profile and add the book link to your bio.",
            "Share a favourite short passage or quote from the book mid-week.",
            "Ask your first readers to leave an honest review on the book page.",
            "Ask us about a launch price — a few days at a lower price creates urgency.",
          ].map((t) => <li key={t}><label><input type="checkbox" /> <span>{t}</span></label></li>)}
        </ul>
      </div>
    </>
  );
}

function captions(b: LiveBook, url: string) {
  const enc = encodeURIComponent;
  const ig = `📖 It’s here! My book “${b.title}” is now available on Veeer Sukhadiya Books.\n\n${b.description ? b.description.slice(0, 180).trim() + (b.description.length > 180 ? "…" : "") + "\n\n" : ""}✨ Read the first pages free, then get the full book for just ₹${b.price}.\n🔗 Link in bio\n\n#newbook #indianauthor #${(b.genre || "books").toLowerCase().replace(/[^a-z]/g, "")} #bookstagram #ebook #readmore`;
  const wa = `Hi! 😊 My book “${b.title}” is finally out. You can read the first pages free here: ${url}\n\nIf you enjoy it, it would mean a lot if you shared it with a friend 🙏`;
  const x = `My book “${b.title}” is out now 📖 Read the first pages free → ${url}`;
  const li = `I’m excited to share that my book “${b.title}” is now published on Veeer Sukhadiya Books.\n\n${b.description ? b.description.slice(0, 260).trim() + (b.description.length > 260 ? "…" : "") + "\n\n" : ""}You can read a free preview here: ${url}\n\nI’d be grateful for your support and any feedback.`;
  return [
    { label: "Instagram / Facebook", text: ig },
    { label: "WhatsApp message", text: wa, share: `https://wa.me/?text=${enc(wa)}`, shareLabel: "WhatsApp" },
    { label: "X (Twitter)", text: x, share: `https://twitter.com/intent/tweet?text=${enc(x)}`, shareLabel: "X" },
    { label: "LinkedIn", text: li, share: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, shareLabel: "LinkedIn" },
  ];
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="s-btn s-btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ } }}>
      {done ? "Copied!" : "Copy"}
    </button>
  );
}

function CopyRow({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: ".5rem" }}>
      <input className="s-input" readOnly value={text} onFocus={(e) => e.currentTarget.select()} />
      <CopyButton text={text} />
    </div>
  );
}

// ─── Canvas share image ─────────────────────────────────────────────────────
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function loadImg(src?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function ShareImage({ book, format }: { book: LiveBook; format: (typeof FORMATS)[number] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = ref.current;
      if (!c) return;
      const { w, h } = format;
      c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#1c1917"); g.addColorStop(1, "#3b2a14");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(183,121,31,0.18)";
      ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, Math.min(w, h) * 0.35, 0, Math.PI * 2); ctx.fill();

      const img = await loadImg(book.cover);
      if (!alive) return;
      const serif = "Georgia, 'Times New Roman', serif";
      const sans = "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

      const drawCover = (x: number, y: number, cw: number) => {
        const ch = cw * 1.5;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 25;
        if (img) {
          const r = img.width / img.height;
          const drawH = r > 1 / 1.5 ? ch : cw / r;
          ctx.drawImage(img, x, y + (ch - drawH) / 2, cw, drawH);
        } else { ctx.fillStyle = "#b7791f"; ctx.fillRect(x, y, cw, ch); }
        ctx.restore();
        return ch;
      };

      const text = (x: number, y: number, maxW: number, align: CanvasTextAlign) => {
        ctx.textAlign = align;
        ctx.fillStyle = "#e0b86a"; ctx.font = `700 ${Math.round(w * 0.022)}px ${sans}`;
        ctx.fillText("NEW BOOK · OUT NOW", x, y); y += w * 0.06;
        ctx.fillStyle = "#ffffff"; const ts = Math.round(w * (format.id === "wide" ? 0.042 : 0.062));
        ctx.font = `700 ${ts}px ${serif}`;
        for (const l of wrap(ctx, book.title, maxW).slice(0, 3)) { ctx.fillText(l, x, y); y += ts * 1.15; }
        y += ts * 0.2;
        ctx.fillStyle = "#d6d3d1"; ctx.font = `400 ${Math.round(w * 0.028)}px ${sans}`;
        ctx.fillText(`by ${book.author}`, x, y); y += w * 0.07;
        const bw = Math.min(maxW, w * 0.42), bh = w * 0.065;
        const bx = align === "center" ? x - bw / 2 : x;
        ctx.fillStyle = "#b7791f"; ctx.beginPath(); (ctx as any).roundRect?.(bx, y - bh * 0.7, bw, bh, bh / 2) ?? ctx.rect(bx, y - bh * 0.7, bw, bh); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(w * 0.026)}px ${sans}`;
        ctx.fillText(`Read free preview · ₹${book.price}`, bx + bw / 2, y - bh * 0.7 + bh * 0.64);
      };

      if (format.id === "wide") {
        const cw = h * 0.5; drawCover(w * 0.08, (h - cw * 1.5) / 2, cw);
        text(w * 0.08 + cw + w * 0.06, h * 0.3, w * 0.5, "left");
      } else if (format.id === "story") {
        const cw = w * 0.52; const ch = drawCover((w - cw) / 2, h * 0.14, cw);
        text(w / 2, h * 0.14 + ch + h * 0.08, w * 0.84, "center");
      } else {
        const cw = w * 0.36; drawCover(w * 0.08, (h - cw * 1.5) / 2, cw);
        text(w * 0.08 + cw + w * 0.06, h * 0.33, w * 0.46, "left");
      }
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `600 ${Math.round(w * 0.022)}px ${sans}`;
      ctx.fillText(absUrl("/").replace(/^https?:\/\//, "").replace(/\/$/, ""), w / 2, h - h * 0.05);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [book, format]);

  const download = () => {
    const c = ref.current;
    if (!c) return;
    try {
      const a = document.createElement("a");
      a.download = `${book.slug}-${format.id}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
      trackMarketplaceEvent("book_shared");
    } catch { /* cross-origin cover */ }
  };

  return (
    <div className="s-card promo-img">
      <canvas ref={ref} style={{ aspectRatio: `${format.w} / ${format.h}` }} aria-label={`${format.label} image for ${book.title}`} />
      <div className="promo-img-foot">
        <span>{format.label}<br /><small>{format.w}×{format.h}</small></span>
        <button className="s-btn s-btn-sm s-btn-primary" onClick={download} disabled={!ready}>Download</button>
      </div>
    </div>
  );
}
