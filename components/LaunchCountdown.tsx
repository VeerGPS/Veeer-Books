"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookPriceText } from "@/components/Price";
import type { ForeignOverride } from "@/lib/currency";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown for a launch price. Refreshes the page when the offer ends so the regular price shows. */
export default function LaunchCountdown({ endsAt, regular, compact = false, label }: { endsAt: string; regular?: { price: number; foreign?: ForeignOverride }; compact?: boolean; label?: string }) {
  const isLaunch = !label || label === "Launch price";
  const name = isLaunch ? "🚀 Launch price" : `🔥 ${label}`;
  const router = useRouter();
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const left = now === null ? end - Date.now() : end - now;
  useEffect(() => {
    if (now !== null && left <= 0) {
      const t = window.setTimeout(() => router.refresh(), 1500);
      return () => window.clearTimeout(t);
    }
  }, [now, left, router]);

  if (left <= 0) return compact ? null : <div className="launch-box launch-ended">{isLaunch ? "The launch offer has ended." : "This offer has ended."}</div>;
  // Render the same markup on the server and first client paint, then start ticking.
  const p = now === null ? { d: parts(left).d, h: -1, m: -1, s: -1 } : parts(left);
  const pad = (n: number) => (n < 0 ? "--" : String(n).padStart(2, "0"));

  if (compact) {
    return <span className="launch-chip" suppressHydrationWarning>{name} · {p.d > 0 ? `${p.d}d ` : ""}{pad(p.h)}:{pad(p.m)}:{pad(p.s)} left</span>;
  }
  return (
    <div className="launch-box" role="timer" aria-live="off">
      <div className="launch-title">{isLaunch ? "🚀 Launch price ends in" : `🔥 ${label} ends in`}</div>
      <div className="launch-clock" suppressHydrationWarning>
        {p.d > 0 ? <span><b>{p.d}</b><i>days</i></span> : null}
        <span><b>{pad(p.h)}</b><i>hrs</i></span>
        <span><b>{pad(p.m)}</b><i>min</i></span>
        <span><b>{pad(p.s)}</b><i>sec</i></span>
      </div>
      {regular ? <div className="launch-after">Then <BookPriceText book={regular} /></div> : null}
    </div>
  );
}
