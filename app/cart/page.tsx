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

type BundleOffer = {
  _id: string;
  slug: string;
  title: string;
  bookIds: number[];
  originalPrice: number;
  bundlePrice: number;
  badge: string;
  isActive: boolean;
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
  const [bundles, setBundles] = useState<BundleOffer[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setCatalog(data.books || []))
      .catch(() => setCatalog([]));

    fetch("/api/bundles")
      .then((res) => res.json())
      .then((data) => setBundles(data.bundles || []))
      .catch(() => setBundles([]));
  }, []);

  const cartBooks = catalog.filter((b) => items.includes(b.id));
  const rawSubtotal = cartBooks.reduce((sum, b) => sum + b.price, 0);

  // Check if cart items contain all books of any active bundle campaign
  const matchingBundle = bundles.find(
    (b) => b.bookIds.length > 0 && b.bookIds.every((id) => items.includes(id))
  );

  let bundleDiscount = 0;
  if (matchingBundle) {
    const bundleOriginalSum = catalog
      .filter((b) => matchingBundle.bookIds.includes(b.id))
      .reduce((sum, b) => sum + b.price, 0);
    const targetPrice = matchingBundle.bundlePrice;
    if (bundleOriginalSum > targetPrice) {
      bundleDiscount = bundleOriginalSum - targetPrice;
    }
  }

  const effectiveSubtotal = Math.max(0, rawSubtotal - bundleDiscount);
  const { discount: couponDiscount, total } = calculateDiscount(effectiveSubtotal, couponDiscountPercent);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(couponCode.trim())}`);
      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error("Invalid coupon code.");
      }

      if (!res.ok) throw new Error(data.error || "Invalid coupon code.");
      setCouponDiscountPercent(data.coupon.discountPercent);
      setCouponMessage(`Coupon applied: ${data.coupon.discountPercent}% off.`);
    } catch (err) {
      setCouponDiscountPercent(0);
      setCouponMessage(err instanceof Error ? err.message : "Invalid coupon code.");
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
        description: matchingBundle
          ? `${matchingBundle.title} Bundle Purchase`
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
            {/* Matching Bundle Highlight Banner */}
            {matchingBundle ? (
              <div
                style={{
                  backgroundColor: "#faf8f5",
                  backgroundImage: "linear-gradient(135deg, #faf8f5 0%, #f4eee2 100%)",
                  border: "2px solid #c5a059",
                  borderRadius: "14px",
                  padding: "1.25rem 1.5rem",
                  boxShadow: "0 4px 15px rgba(197, 160, 89, 0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <span style={{ backgroundColor: "#c5a059", color: "#1c1917", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                      🎁 BUNDLE OFFER APPLIED
                    </span>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--serif)", margin: "0.4rem 0 0.2rem 0" }}>
                      {matchingBundle.title}
                    </h3>
                    <p style={{ color: "#5a5a5a", fontSize: "0.9rem", margin: 0 }}>
                      All {matchingBundle.bookIds.length} books bundled together at special offer price!
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#15803d", fontFamily: "var(--serif)" }}>
                      INR {matchingBundle.bundlePrice.toFixed(2)}
                    </div>
                    <div style={{ textDecoration: "line-through", color: "#8c857b", fontSize: "0.9rem" }}>
                      INR {rawSubtotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Cart Items List */}
            <div className="cart-card">
              {cartBooks.length === 0 ? (
                <p className="muted">Your cart is empty.</p>
              ) : (
                cartBooks.map((b) => {
                  const isBundleBook = matchingBundle?.bookIds.includes(b.id);
                  return (
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
                        {isBundleBook ? (
                          <div style={{ marginTop: "0.25rem" }}>
                            <span style={{ textDecoration: "line-through", color: "#8c857b", fontSize: "0.85rem", marginRight: "0.5rem" }}>
                              INR {b.price.toFixed(2)}
                            </span>
                            <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700 }}>
                              Included in Bundle Offer
                            </span>
                          </div>
                        ) : (
                          <div className="muted">INR {b.price.toFixed(2)}</div>
                        )}
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

            {/* Price Line Breakdown */}
            <div style={{ margin: "1rem 0", padding: "0.75rem 0", borderTop: "1px solid #e2ddd3", borderBottom: "1px solid #e2ddd3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#5a5a5a", fontSize: "0.95rem" }}>
                <span>Individual Subtotal:</span>
                <span style={bundleDiscount > 0 ? { textDecoration: "line-through", color: "#8c857b" } : {}}>
                  INR {rawSubtotal.toFixed(2)}
                </span>
              </div>

              {bundleDiscount > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#15803d", fontWeight: 700, fontSize: "0.95rem" }}>
                  <span>🎁 Bundle Savings:</span>
                  <span>-INR {bundleDiscount.toFixed(2)}</span>
                </div>
              ) : null}

              {couponDiscount > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#15803d", fontWeight: 700, fontSize: "0.95rem" }}>
                  <span>Coupon Discount:</span>
                  <span>-INR {couponDiscount.toFixed(2)}</span>
                </div>
              ) : null}
            </div>

            <div style={{ fontSize: "0.85rem", color: "#5a5a5a", textTransform: "uppercase", fontWeight: 700 }}>Total Price</div>
            <div className="summary-total" style={{ color: "#1a1a1a", fontFamily: "var(--serif)" }}>INR {total.toFixed(2)}</div>

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
