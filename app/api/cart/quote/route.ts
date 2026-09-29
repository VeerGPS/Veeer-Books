import { NextRequest, NextResponse } from "next/server";
import { getOptionalAuth } from "@/lib/auth";
import { quoteCart } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// POST /api/cart/quote — the exact total the server will charge for this cart.
export async function POST(req: NextRequest) {
  try {
    const auth = getOptionalAuth(req);
    const { items, couponCode, refCode } = await req.json().catch(() => ({}));
    const quote = await quoteCart({ items: Array.isArray(items) ? items : [], couponCode, refCode, userId: auth?.userId });
    const { referrerUserId, ...publicQuote } = quote;
    return NextResponse.json({ quote: publicQuote, referralApplied: Boolean(referrerUserId) });
  } catch (err) {
    console.error("Cart quote error:", err);
    return NextResponse.json({ error: "Could not price your cart" }, { status: 500 });
  }
}
