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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKS } from "@/lib/books";
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

  const cartBooks = BOOKS.filter((b) => items.includes(b.id));
  const total = cartBooks.reduce((sum, b) => sum + b.price, 0);

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
    if (typeof window === "undefined" || typeof window.Razorpay === "undefined") {
      alert(
        "Razorpay Checkout failed to load. Check your internet connection and refresh."
      );
      return;
    }

    setBusy(true);
    try {
      const [{ key }, orderResp] = await Promise.all([
        apiRazorpayKey(),
        apiRazorpayOrder({ amountINR: total, items }),
      ]);

      if (!key) throw new Error("Razorpay key missing (server)");
      const order = orderResp?.order;
      if (!order) throw new Error("Could not create order (server)");

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
          console.error(resp);
          alert(resp?.error?.description || "Payment failed.");
          setBusy(false);
        }
      );
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(
        (err as Error).message ||
          "Could not start payment. Is the server running?"
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
                    src={b.cover}
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
