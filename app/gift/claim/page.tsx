"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { markGiftClaimed } from "@/components/GiftSignup";
import { GIFT_BOOK } from "@/lib/gift";

export default function ClaimGiftPage() {
  const { token, addPurchasedBooks, isReady, isLoggedIn } = useAuth();
  const { show } = useModal();
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");
  const [saved, setSaved] = useState(false);
  const [book, setBook] = useState<{ slug: string; title: string }>({ slug: GIFT_BOOK.slug, title: GIFT_BOOK.title });

  useEffect(() => {
    if (!isReady) return;
    const t = new URLSearchParams(window.location.search).get("t") || "";
    fetch("/api/subscribe/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ t }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return setState("bad");
        addPurchasedBooks([j.bookId || GIFT_BOOK.id]);
        markGiftClaimed(j.bookId);
        if (j.slug) setBook({ slug: j.slug, title: j.title || GIFT_BOOK.title });
        setSaved(Boolean(j.savedToAccount));
        setState("ok");
      })
      .catch(() => setState("bad"));
  }, [isReady, token, addPurchasedBooks]);

  return (
    <main className="container" style={{ maxWidth: 560, padding: "4rem 16px", textAlign: "center" }}>
      {state === "loading" ? <p>Unlocking your free book…</p> : state === "bad" ? (
        <>
          <h1 style={{ fontFamily: "var(--serif)" }}>This gift link didn’t work</h1>
          <p className="muted">It may have been copied incompletely. You can get the book again in seconds.</p>
          <Link href="/free-book" className="btn btn-primary">Get the free book</Link>
        </>
      ) : (
        <>
          <div style={{ fontSize: "2.5rem" }}>🎁</div>
          <h1 style={{ fontFamily: "var(--serif)" }}>{book.title} is unlocked</h1>
          <p className="muted" style={{ marginBottom: "1.25rem" }}>
            {saved ? "It’s saved in your library on every device." : "It’s unlocked on this device. Sign in or create a free account with the same email to keep it everywhere."}
          </p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/reader/${book.slug}`} className="btn btn-primary">Start reading</Link>
            {!isLoggedIn ? <button className="btn btn-outline" onClick={() => show("signup")}>Create free account</button> : null}
          </div>
        </>
      )}
    </main>
  );
}
