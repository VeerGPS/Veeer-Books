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

    const percent = Number(discountPercent);
    if (!normalizedCode || !Number.isFinite(percent) || percent < 1 || percent > 100) {
      return NextResponse.json({ error: "Invalid coupon data" }, { status: 400 });
    }

    const coupon = await CouponModel.create({
      code: normalizedCode,
      discountPercent: percent,
      active: Boolean(active),
    });

    return NextResponse.json({ coupon, message: "Coupon created" });
  } catch (error) {
    console.error("Admin coupon create error:", error);
    return NextResponse.json({ error: "Unable to save coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = normalizeCouponCode(new URL(req.url).searchParams.get("code") || "");
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    await connectDB();
    const coupon = await CouponModel.findOneAndDelete({ code });
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Coupon deleted", code });
  } catch (error) {
    console.error("Admin coupon delete error:", error);
    return NextResponse.json({ error: "Unable to delete coupon" }, { status: 500 });
  }
}
