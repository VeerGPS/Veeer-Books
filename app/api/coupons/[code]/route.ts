import { NextRequest, NextResponse } from "next/server";
import { getOptionalAuth } from "@/lib/auth";
import { findCoupon } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = getOptionalAuth(req);
  const { coupon, error } = await findCoupon(params.code || "", auth?.userId);
  if (coupon) {
    return NextResponse.json({ coupon: { code: coupon.code, discountPercent: coupon.percent, active: true } });
  }
  return NextResponse.json({ error: error || "Invalid coupon code." }, { status: 404 });
}
