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

function couponFields(body: any) {
  const kind = body.kind === "flat" ? "flat" : "percent";
  const percent = Number(body.discountPercent) || 0;
  const flatInr = Math.round(Number(body.flatInr) || 0);
  if (kind === "percent" && (percent < 1 || percent > 100)) return { error: "Discount must be between 1% and 100%." };
  if (kind === "flat" && (flatInr < 1 || flatInr > 100000)) return { error: "Enter the amount off in rupees." };
  const d = (v: unknown) => { if (!v) return null; const x = new Date(String(v)); return isNaN(+x) ? null : x; };
  const startsAt = d(body.startsAt), expiresAt = d(body.expiresAt);
  if (startsAt && expiresAt && expiresAt <= startsAt) return { error: "The coupon must end after it starts." };
  return {
    fields: {
      kind,
      discountPercent: kind === "percent" ? percent : 0,
      flatInr: kind === "flat" ? flatInr : 0,
      minOrderInr: Math.max(0, Math.round(Number(body.minOrderInr) || 0)),
      minBooks: Math.max(0, Math.round(Number(body.minBooks) || 0)),
      firstOrderOnly: Boolean(body.firstOrderOnly),
      maxUses: Math.max(0, Math.round(Number(body.maxUses) || 0)),
      bookIds: Array.isArray(body.bookIds) ? body.bookIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0) : [],
      startsAt,
      expiresAt,
      note: typeof body.note === "string" ? body.note.slice(0, 120) : "",
      active: body.active === undefined ? true : Boolean(body.active),
    },
  };
}

/** Create a coupon, or update it when `originalCode` (or the same code with `update: true`) is sent. */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const normalizedCode = normalizeCouponCode(body.code);
    if (!normalizedCode || normalizedCode.length < 3) return NextResponse.json({ error: "Coupon code must be at least 3 letters/numbers." }, { status: 400 });
    const parsed = couponFields(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const original = normalizeCouponCode(body.originalCode || "");
    if (original) {
      if (original !== normalizedCode && (await CouponModel.exists({ code: normalizedCode }))) {
        return NextResponse.json({ error: "Another coupon already uses that code." }, { status: 409 });
      }
      const coupon = await CouponModel.findOneAndUpdate({ code: original }, { $set: { code: normalizedCode, ...parsed.fields } }, { new: true });
      if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      return NextResponse.json({ coupon, message: "Coupon updated" });
    }
    if (await CouponModel.exists({ code: normalizedCode })) {
      return NextResponse.json({ error: "That coupon code already exists — edit it instead." }, { status: 409 });
    }
    const coupon = await CouponModel.create({ code: normalizedCode, ...parsed.fields });
    return NextResponse.json({ coupon, message: "Coupon created" });
  } catch (error) {
    console.error("Admin coupon create error:", error);
    return NextResponse.json({ error: "Unable to save coupon" }, { status: 500 });
  }
}

/** PATCH {code, active} — switch a coupon on or off. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isAdminPasswordValid(req.headers.get("x-admin-password"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { code, active } = await req.json().catch(() => ({}));
    await connectDB();
    const coupon = await CouponModel.findOneAndUpdate({ code: normalizeCouponCode(code || "") }, { $set: { active: Boolean(active) } }, { new: true });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Admin coupon toggle error:", error);
    return NextResponse.json({ error: "Unable to update coupon" }, { status: 500 });
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
