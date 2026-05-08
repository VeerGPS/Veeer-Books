// POST /api/razorpay/verify  (auth required)
//
// Verifies the HMAC signature returned by Razorpay Checkout, marks the
// matching Order as paid, and adds purchased book IDs to the user's
// purchasedBooks list.
//
// Logic preserved exactly from the original server.js:
//   - HMAC SHA256 of `${order_id}|${payment_id}` keyed by RAZORPAY_KEY_SECRET
//   - $addToSet with $each ensures no duplicate book IDs

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectDB } from "@/lib/mongoose";
import { Order, User } from "@/models";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Bad signature" },
        { status: 400 }
      );
    }

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }

    await User.findByIdAndUpdate(auth.userId, {
      $addToSet: { purchasedBooks: { $each: order.items } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    return NextResponse.json(
      { ok: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
