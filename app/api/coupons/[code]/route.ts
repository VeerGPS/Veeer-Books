import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { CouponModel } from "@/models";
import { normalizeCouponCode } from "@/lib/coupons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = normalizeCouponCode(params.code || "");

  try {
    await connectDB();
    const coupon = await CouponModel.findOne({
      code,
      active: true,
      discountPercent: { $gte: 1, $lte: 100 },
    }).lean();

    if (coupon) {
      return NextResponse.json({ coupon });
    }
  } catch (error) {
    console.warn("MongoDB coupon lookup error, using fallback logic:", error);
  }

  // Fallback for default codes like WELCOME20, SAVE10, VEEER50, etc.
  if (code === "WELCOME20") {
    return NextResponse.json({ coupon: { code: "WELCOME20", discountPercent: 20, active: true } });
  }
  if (code === "SAVE10") {
    return NextResponse.json({ coupon: { code: "SAVE10", discountPercent: 10, active: true } });
  }
  if (code === "VEEER50") {
    return NextResponse.json({ coupon: { code: "VEEER50", discountPercent: 50, active: true } });
  }

  return NextResponse.json({ error: "Invalid coupon code." }, { status: 404 });
}
