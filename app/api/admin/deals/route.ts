// GET/PUT /api/admin/deals — every store-wide deal setting (sale, multi-buy, free book, top bar…).
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";
import { connectDB } from "@/lib/mongoose";
import { BookModel, CouponModel, Order, Subscriber } from "@/models";
import { BOOKS_CACHE_TAG } from "@/lib/books";
import { DEALS_CACHE_TAG, readDealsFromDB, saveDeals } from "@/lib/deals";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!isAdminPasswordValid(req.headers.get("x-admin-password"))) return unauthorized();
  try {
    await connectDB();
    const [deals, books, coupons, couponOrders, subscribers] = await Promise.all([
      readDealsFromDB(),
      BookModel.find({}, { id: 1, title: 1, slug: 1, sellingPrice: 1, price: 1, actualPrice: 1, launchPrice: 1, launchEndsAt: 1, isActive: 1, cover: 1 }).sort({ id: 1 }).lean(),
      CouponModel.find({ ownerUserId: { $exists: false } }).sort({ createdAt: -1 }).lean(),
      Order.find({ status: "paid", couponCode: { $exists: true, $ne: null } }, { couponCode: 1, amountInr: 1, amount: 1 }).lean(),
      Subscriber.countDocuments({}),
    ]);
    const perCoupon: Record<string, { orders: number; revenueInr: number }> = {};
    for (const o of couponOrders as any[]) {
      const k = String(o.couponCode);
      perCoupon[k] = perCoupon[k] || { orders: 0, revenueInr: 0 };
      perCoupon[k].orders += 1;
      perCoupon[k].revenueInr += Math.round(Number(o.amountInr ?? o.amount) || 0);
    }
    return NextResponse.json({
      deals,
      books: books.map((b: any) => ({
        id: b.id, title: b.title, slug: b.slug, cover: b.cover, isActive: b.isActive !== false,
        price: Number(b.sellingPrice) > 0 ? b.sellingPrice : Number(b.price) > 0 ? b.price : Number(b.actualPrice) || 0,
        launchPrice: Number(b.launchPrice) || 0,
        launchEndsAt: b.launchEndsAt || null,
      })),
      coupons: coupons.map((c: any) => ({ ...c, stats: perCoupon[c.code] || { orders: 0, revenueInr: 0 } })),
      subscribers,
    });
  } catch (e) {
    console.error("Admin deals load error:", e);
    return NextResponse.json({ error: "Could not load deals" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminPasswordValid(req.headers.get("x-admin-password"))) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
    if (body.sale?.enabled && !body.sale?.endsAt) return NextResponse.json({ error: "Give the sale an end date and time." }, { status: 400 });
    if (body.sale?.enabled && body.sale?.startsAt && body.sale?.endsAt && new Date(body.sale.endsAt) <= new Date(body.sale.startsAt)) {
      return NextResponse.json({ error: "The sale must end after it starts." }, { status: 400 });
    }
    const deals = await saveDeals(body);
    revalidateTag(DEALS_CACHE_TAG);
    revalidateTag(BOOKS_CACHE_TAG);
    revalidatePath("/", "layout"); // every page shows the top bar and prices
    return NextResponse.json({ deals, message: "Saved — live on the store within a few seconds." });
  } catch (e) {
    console.error("Admin deals save error:", e);
    return NextResponse.json({ error: "Could not save deals" }, { status: 500 });
  }
}
