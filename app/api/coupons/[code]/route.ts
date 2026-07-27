import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { CouponModel } from "@/models";
import { normalizeCouponCode } from "@/lib/coupons";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await connectDB();
    const code = normalizeCouponCode(params.code);
    const coupon = await CouponModel.findOne({
      code,
      active: true,
      discountPercent: { $gte: 1, $lte: 100 },
    }).lean();
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Coupon lookup error:", error);
    return NextResponse.json({ error: "Coupon lookup failed" }, { status: 500 });
  }
}
