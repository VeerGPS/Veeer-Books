"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GiftSignup, { isGiftClaimed } from "@/components/GiftSignup";
import { useDeals } from "@/contexts/DealsContext";

const SEEN_KEY = "vsb_gift_popup_seen";
const QUIET_DAYS = 14;
const HIDE_ON = ["/reader", "/cart", "/admin", "/author", "/free-book", "/gift", "/library"];

/** Friendly free-book offer: after ~12 s of browsing or when the mouse leaves the page. Shown at most every 14 days. */
export default function GiftPopup() {
  const pathname = usePathname() || "/";
  const { purchasedBooks, isReady } = useAuth();
  const [open, setOpen] = useState(false);
  const { gift, popups } = useDeals();
  const giftId = gift?.id;

  useEffect(() => {
    if (!isReady) return;
    if (HIDE_ON.some((p) => pathname.startsWith(p))) return;
    if (!giftId || !popups.gift) return;
    if (purchasedBooks.includes(giftId)) return;
    if (isGiftClaimed(giftId)) return;
    try {
      const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
      if (seen && Date.now() - seen < QUIET_DAYS * 86400_000) return;
    } catch { return; }

    let retry = 0;
    const show = () => {
      // Don't stack on top of another offer; try again a little later.
      if (document.querySelector(".bundle-modal-backdrop")) {
        window.clearTimeout(retry);
        retry = window.setTimeout(show, 20_000);
        return;
      }
      setOpen(true);
      try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
      cleanup();
    };
    const timer = window.setTimeout(show, Math.max(0, popups.giftDelaySeconds) * 1000);
    // Exit-intent only on real mouse devices — touch screens fire fake mouse events.
    const hasMouse = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    const onLeave = (e: MouseEvent) => { if (hasMouse && !e.relatedTarget && e.clientY <= 0) show(); };
    document.addEventListener("mouseout", onLeave);
    function cleanup() { window.clearTimeout(timer); window.clearTimeout(retry); document.removeEventListener("mouseout", onLeave); }
    return cleanup;
  }, [pathname, isReady, purchasedBooks, giftId, popups.gift, popups.giftDelaySeconds]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="gift-veil" role="dialog" aria-modal="true" aria-label="Free book offer" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="gift-modal-box">
        <button className="gift-close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        <GiftSignup variant="modal" source="popup" />
      </div>
    </div>
  );
}
