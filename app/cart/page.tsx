"use client";

// Migrated from the original cart.html. Uses the cart + auth contexts and
// calls the Next.js API routes (same-origin, no localhost hardcoding).
//
// The Razorpay Checkout flow is identical:
//   GET /api/razorpay/key       → returns public key
//   POST /api/razorpay/order    → creates order, returns order object
//   <Razorpay Checkout opens>
//   POST /api/razorpay/verify   → verifies signature, marks paid

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Book } from "@/lib/books";
import { clearRefCode, getRefCode } from "@/lib/referral-client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatMoney, isCurrency, type Currency } from "@/lib/currency";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useModal } from "@/contexts/ModalContext";
import { canOptimize } from "@/lib/image";
import {
  apiRazorpayKey,
  apiRazorpayOrder,
  apiRazorpayVerify,
} from "@/lib/api-client";

type Quote = {
  lines: { id: number; title: string; price: number; regularPrice?: number; launchEndsAt?: string; offerLabel?: string }[];
  subtotal: number;
  bundle?: { title: string; discount: number };
  discount?: { kind: "coupon" | "referral" | "multibuy" | "welcome"; code: string; percent: number; amount: number; label: string };
  couponError?: string;
  referralNote?: string;
  nextTier?: { booksNeeded: number; percent: number };
  welcomeHint?: number;
  total: number;
};

// Razorpay Checkout is loaded as a global script in app/layout.tsx
declare global {
  interface Window {
    // Razorpay checkout — `any` is acceptable here since the script is third-party
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}


export default function CartPage() {
  const router = useRouter();
  const { items, remove, clear } = useCart();
  const { token, addPurchasedBooks } = useAuth();
  const { show } = useModal();
  const [busy, setBusy] = useState(false);
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [refCode, setRefCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const { currency, bookPrice } = useCurrency();
  // Amounts come from the server quote, in the quote's currency.
  const quoteCur: Currency = quote && isCurrency((quote as any).currency) ? (quote as any).currency : currency;
  const inrFmt = (n: number) => formatMoney(n, quoteCur);

  useEffect(() => {
    setRefCode(getRefCode());
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setCatalog(data.books || []))
      .catch(() => setCatalog([]));
  }, []);

  // The server prices the cart (launch prices, bundles, coupon or friend discount).
  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    let alive = true;
    setQuoting(true);
    const t = setTimeout(() => {
      fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items, couponCode, refCode, currency }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (!alive || !j.quote) return;
          setQuote(j.quote);
          if (j.quote.owned?.length) {
            addPurchasedBooks(j.quote.owned);
            j.quote.owned.forEach((id: number) => remove(id));
          }
        })
        .catch(() => {})
        .finally(() => alive && setQuoting(false));
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [items, couponCode, refCode, token, addPurchasedBooks, remove, currency]);

  const cartBooks = catalog.filter((b) => items.includes(b.id));
  const priceOf = (id: number) => quote?.lines.find((l) => l.id === id);
  const subtotal = quote?.subtotal ?? cartBooks.reduce((sum, b) => sum + bookPrice(b).price, 0);
  const total = quote?.total ?? subtotal;
  const couponApplied = quote?.discount?.kind === "coupon";
  const couponMessage = couponCode
    ? couponApplied ? `Coupon applied: ${quote?.discount?.label}.`
    : quote?.couponError ? quote.couponError
    : quote?.discount ? `You already have a better offer (${quote.discount.label}), so we kept that.` : ""
    : "";

  const applyCoupon = () => setCouponCode(couponInput.trim().toUpperCase());

  const onCheckout = async () => {
    if (!token) {
      alert("Please sign in first.");
      show("login");
      return;
    }
    if (cartBooks.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (total < (quoteCur === "INR" ? 1 : 0.5)) {
      alert("Your cart total is below the minimum amount for checkout.");
      return;
    }
    try {
      if (typeof window === "undefined") throw new Error("Window unavailable");
      if (typeof window.Razorpay === "undefined") {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Razorpay failed to load"));
          document.body.appendChild(script);
        });
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message || "Razorpay Checkout failed to load.");
      return;
    }

    setBusy(true);
    try {
      const [{ key }, orderResp] = await Promise.all([
        apiRazorpayKey(),
        apiRazorpayOrder({ items, couponCode: couponApplied ? couponCode : undefined, refCode: refCode || undefined, currency: quoteCur }),
      ]);

      if (!key) throw new Error("Razorpay API key missing on server configuration.");
      const order = orderResp?.order;
      if (!order) throw new Error(orderResp?.error || "Could not create order on server.");

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Veeer Sukhadiya Books",
        description: quote?.bundle
          ? `${quote.bundle.title} Bundle Purchase`
          : `Cart purchase (${cartBooks.length} item${cartBooks.length > 1 ? "s" : ""})`,
        order_id: order.id,
        prefill: { name: "", email: "" },
        theme: { color: "#c5a059" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await apiRazorpayVerify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verified || !verified.ok) {
              throw new Error(verified?.error || "Payment verification failed");
            }
            addPurchasedBooks(items);
            clear();
            clearRefCode();
            alert("✅ Payment successful. Books added to your library.");
            router.push("/library");
          } catch (err) {
            console.error(err);
            alert((err as Error).message || "Payment verification failed.");
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on(
        "payment.failed",
        (resp: { error?: { description?: string } }) => {
          console.error("Razorpay Payment Failed Event:", resp);
          alert(resp?.error?.description || "Payment failed. Please check your card or UPI details.");
          setBusy(false);
        }
      );
      rzp.open();
    } catch (err) {
      console.error("Checkout Error:", err);
      alert(
        (err as Error).message ||
          "Could not start payment. Please check server logs."
      );
      setBusy(false);
    }
  };

  return (
    <main className="cart-page">
      <section className="container">
        <h1 className="section-title" style={{ marginBottom: "1.5rem", paddingTop: 0 }}>
          Your Cart
        </h1>

        <div className="cart-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {refCode && quote?.discount?.kind === "referral" ? (
              <div className="cart-note cart-note-good">🎁 A friend invited you — you get <b>{quote.discount.percent}% off</b> your first order.</div>
            ) : refCode && quote?.referralNote ? (
              <div className="cart-note">{quote.referralNote}</div>
            ) : null}
            {quote?.discount?.kind === "multibuy" || quote?.discount?.kind === "welcome" ? (
              <div className="cart-note cart-note-good">🎉 <b>{quote.discount.label}</b> applied automatically.</div>
            ) : null}
            {quote?.nextTier && cartBooks.length > 0 ? (
              <div className="cart-note cart-note-gold">
                Add <b>{quote.nextTier.booksNeeded} more book{quote.nextTier.booksNeeded === 1 ? "" : "s"}</b> and get <b>{quote.nextTier.percent}% off</b> your whole order. <Link href="/#collection">Browse books →</Link>
              </div>
            ) : null}
            {quote?.welcomeHint && cartBooks.length > 0 ? (
              <div className="cart-note">👋 New here? <b>Sign in</b> to get <b>{quote.welcomeHint}% off</b> your first order.</div>
            ) : null}
            {quote?.bundle ? (
              <div className="cart-note cart-note-gold">
                <b>Bundle offer applied — {quote.bundle.title}.</b> You save {inrFmt(quote.bundle.discount)} by getting these books together.
              </div>
            ) : null}

            {/* Cart Items List */}
            <div className="cart-card">
              {cartBooks.length === 0 ? (
                <p className="muted">Your cart is empty.</p>
              ) : (
                cartBooks.map((b) => {
                  const line = priceOf(b.id);
                  const unit = line?.price ?? bookPrice(b).price;
                  return (
                    <div className="cart-item" key={b.id}>
                      <Image
                        src={b.cover || "/images/default-book.svg"}
                        sizes="70px"
                        unoptimized={!canOptimize(b.cover)}
                        alt={b.title}
                        width={70}
                        height={98}
                        className="cart-thumb"
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{b.title}</div>
                        <div className="muted">
                          {inrFmt(unit)}
                          {line?.regularPrice ? <span className="cart-strike">{inrFmt(line.regularPrice)}</span> : null}
                          {line?.launchEndsAt ? <span className="cart-tag">{line.offerLabel || "Launch price"}</span> : null}
                        </div>
                      </div>
                      <div className="cart-item-actions">
                        <Link
                          className="btn btn-outline btn-sm"
                          href={`/product/${b.slug}`}
                        >
                          View
                        </Link>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => remove(b.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>
            <p className="muted">
              {cartBooks.length} item{cartBooks.length === 1 ? "" : "s"}
            </p>

            <div className="cart-lines">
              <div><span>Subtotal</span><span>{inrFmt(subtotal)}</span></div>
              {quote?.bundle ? <div className="good"><span>Bundle savings</span><span>−{inrFmt(quote.bundle.discount)}</span></div> : null}
              {quote?.discount ? <div className="good"><span>{quote.discount.label}</span><span>−{inrFmt(quote.discount.amount)}</span></div> : null}
            </div>

            <div style={{ fontSize: "0.85rem", color: "#5a5a5a", textTransform: "uppercase", fontWeight: 700 }}>Total</div>
            <div className="summary-total" style={{ color: "#1a1a1a", fontFamily: "var(--serif)", opacity: quoting ? 0.6 : 1 }}>{inrFmt(total)}</div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label htmlFor="couponCode">Coupon Code</label>
              <input id="couponCode" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(); }} placeholder="Enter code" />
            </div>
            <button className="btn btn-outline btn-full" type="button" onClick={applyCoupon} style={{ marginBottom: "0.75rem" }}>Apply Coupon</button>
            {couponMessage ? <p style={{ color: couponApplied ? "#15803d" : "#b91c1c", marginBottom: "1rem", fontSize: "0.9rem" }}>{couponMessage}</p> : null}
            <button
              className="btn btn-primary btn-full"
              onClick={onCheckout}
              disabled={busy || quoting || cartBooks.length === 0}
            >
              {busy ? "Starting payment…" : "Checkout"}
            </button>
            <Link
              href="/"
              className="btn btn-outline btn-full"
              style={{ marginTop: "0.65rem" }}
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
