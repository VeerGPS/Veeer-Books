import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { CouponModel } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { normalizeCouponCode } from "@/lib/coupons";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const coupons = await CouponModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Admin coupon list error:", error);
    return NextResponse.json({ error: "Unable to load coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { code, discountPercent, active } = await req.json();
    const normalizedCode = normalizeCouponCode(code);

    if (!normalizedCode || !Number.isFinite(Number(discountPercent))) {
      return NextResponse.json({ error: "Invalid coupon data" }, { status: 400 });
    }

    const coupon = await CouponModel.create({
      code: normalizedCode,
      discountPercent: Number(discountPercent),
      active: Boolean(active),
    });

    return NextResponse.json({ coupon, message: "Coupon created" });
  } catch (error) {
    console.error("Admin coupon create error:", error);
    return NextResponse.json({ error: "Unable to save coupon" }, { status: 500 });
  }
}
