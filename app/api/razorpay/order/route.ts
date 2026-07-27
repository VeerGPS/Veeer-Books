// POST /api/razorpay/order  (auth required)
// Creates a Razorpay order, persists a local Order record (status: created),
// returns the Razorpay order to the client for Checkout.

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Order } from "@/models";
import { requireAuth } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const { amountINR, items } = await req.json();

    const numericAmount = Number(amountINR || 0);
    if (!numericAmount || numericAmount < 1) {
      return NextResponse.json(
        { error: "Cart total must be at least ₹1 to process checkout." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items selected in cart." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const order = new Order({
      userId: auth.userId,
      amount: numericAmount,
      razorpayOrderId: razorpayOrder.id,
      items,
    });
    await order.save();

    return NextResponse.json({ order: razorpayOrder });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    const errorMessage =
      err && typeof err === "object" && "description" in err
        ? String((err as { description?: string }).description)
        : err instanceof Error
        ? err.message
        : "Failed to create Razorpay order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
