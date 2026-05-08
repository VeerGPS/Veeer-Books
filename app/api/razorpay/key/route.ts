// GET /api/razorpay/key
// Returns the public Razorpay key so the front-end can open Checkout.
// Identical to the original Express handler.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ key: process.env.RAZORPAY_KEY_ID });
}
