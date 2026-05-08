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

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amountINR * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const order = new Order({
      userId: auth.userId,
      amount: amountINR,
      razorpayOrderId: razorpayOrder.id,
      items,
    });
    await order.save();

    return NextResponse.json({ order: razorpayOrder });
  } catch (err) {
    console.error("Razorpay order error:", err);
    return NextResponse.json({ error: "Order failed" }, { status: 500 });
  }
}
