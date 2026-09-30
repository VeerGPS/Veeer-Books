// POST /api/razorpay/order  (auth required)
// Prices the cart on the server (launch prices, bundles, coupon or referral),
// creates the Razorpay order for that amount and stores a local Order.

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Order } from "@/models";
import { requireAuth } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";
import { quoteCart } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const { items, couponCode, refCode, currency } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items selected in cart." }, { status: 400 });
    }

    const quote = await quoteCart({ items, couponCode, refCode, currency, userId: auth.userId });
    if (!quote.lines.length) {
      return NextResponse.json(
        { error: quote.owned?.length ? "You already own these books — find them in My Library." : "These books are no longer available." },
        { status: 400 }
      );
    }
    const minimum = quote.currency === "INR" ? 1 : 0.5;
    if (quote.total < minimum) {
      return NextResponse.json({ error: "Cart total is below the minimum amount for checkout." }, { status: 400 });
    }

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(quote.total * 100),
      currency: quote.currency, // INR, or USD/GBP for international shoppers (needs Razorpay international payments)
      receipt: `rcpt_${Date.now()}`,
    });

    await Order.create({
      userId: auth.userId,
      amount: quote.total,
      currencyPaid: quote.currency,
      fxRate: quote.fxRate,
      amountInr: Math.round(quote.total * quote.fxRate * 100) / 100,
      subtotal: quote.subtotal,
      discount: Math.round(((quote.bundle?.discount || 0) + (quote.discount?.amount || 0)) * 100) / 100,
      couponCode: quote.discount?.kind === "coupon" ? quote.discount.code : undefined,
      referralCode: quote.discount?.kind === "referral" ? quote.discount.code : undefined,
      referrerUserId: quote.referrerUserId,
      razorpayOrderId: razorpayOrder.id,
      items: quote.lines.map((l) => l.id),
    });

    return NextResponse.json({ order: razorpayOrder, total: quote.total });
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
