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
import { calculateDiscount } from "@/lib/coupons";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useModal } from "@/contexts/ModalContext";
import {
  apiRazorpayKey,
  apiRazorpayOrder,
  apiRazorpayVerify,
} from "@/lib/api-client";

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
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setCatalog(data.books || []))
      .catch(() => setCatalog([]));
  }, []);

  const cartBooks = catalog.filter((b) => items.includes(b.id));
  const subtotal = cartBooks.reduce((sum, b) => sum + b.price, 0);
  const { discount, total } = calculateDiscount(subtotal, couponDiscountPercent);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coupon invalid");
      setCouponDiscountPercent(data.coupon.discountPercent);
      setCouponMessage(`Coupon applied: ${data.coupon.discountPercent}% off.`);
    } catch (err) {
      setCouponDiscountPercent(0);
      setCouponMessage(err instanceof Error ? err.message : "Coupon invalid");
    }
  };

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
    if (total < 1) {
      alert("Cart total must be at least ₹1 for checkout.");
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
        apiRazorpayOrder({ amountINR: total, items }),
      ]);

      if (!key) throw new Error("Razorpay API key missing on server configuration.");
      const order = orderResp?.order;
      if (!order) throw new Error(orderResp?.error || "Could not create order on server.");

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Veeer Sukhadiya Books",
        description: `Cart purchase (${cartBooks.length} item${
          cartBooks.length > 1 ? "s" : ""
        })`,
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
          <div className="cart-card">
            {cartBooks.length === 0 ? (
              <p className="muted">Your cart is empty.</p>
            ) : (
              cartBooks.map((b) => (
                <div className="cart-item" key={b.id}>
                  <Image
                    src={b.cover || "/images/default-book.svg"}
                    unoptimized
                    alt={b.title}
                    width={70}
                    height={98}
                    className="cart-thumb"
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div className="muted">INR {b.price.toFixed(2)}</div>
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
              ))
            )}
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>
            <p className="muted">
              {cartBooks.length} item{cartBooks.length === 1 ? "" : "s"}
            </p>
            <div className="summary-total">INR {total.toFixed(2)}</div>
            {discount > 0 ? <p className="muted">Discount: INR {discount.toFixed(2)}</p> : null}
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label htmlFor="couponCode">Coupon Code</label>
              <input id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="WELCOME10" />
            </div>
            <button className="btn btn-outline btn-full" type="button" onClick={applyCoupon} style={{ marginBottom: "0.75rem" }}>Apply Coupon</button>
            {couponMessage ? <p style={{ color: couponMessage.includes("applied") ? "green" : "crimson", marginBottom: "1rem" }}>{couponMessage}</p> : null}
            <button
              className="btn btn-primary btn-full"
              onClick={onCheckout}
              disabled={busy || cartBooks.length === 0}
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
