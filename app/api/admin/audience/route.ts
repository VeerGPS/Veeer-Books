// GET /api/admin/audience — free-book sign-ups and paying customers (admin only).
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Order, Subscriber, User } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { GIFT_BOOK } from "@/lib/gift";

export const dynamic = "force-dynamic";

const DAY = 86400_000;

export async function GET(req: NextRequest) {
  if (!isAdminPasswordValid(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const [subs, orders] = await Promise.all([
      Subscriber.find({}, { giftToken: 0 }).sort({ createdAt: -1 }).limit(10000).lean(),
      Order.find({ status: "paid" }, { userId: 1, amount: 1, amountInr: 1, currencyPaid: 1, items: 1, createdAt: 1, couponCode: 1, referralCode: 1 }).lean(),
    ]);

    // Paid orders per customer (amounts converted to INR for totals).
    const byUser = new Map<string, { orders: number; spentInr: number; books: Set<number>; first: Date; last: Date; currencies: Set<string> }>();
    for (const o of orders as any[]) {
      const k = String(o.userId);
      const inr = typeof o.amountInr === "number" ? o.amountInr : (o.currencyPaid && o.currencyPaid !== "INR" ? 0 : o.amount || 0);
      const e = byUser.get(k) || { orders: 0, spentInr: 0, books: new Set<number>(), first: o.createdAt, last: o.createdAt, currencies: new Set<string>() };
      e.orders += 1;
      e.spentInr += inr;
      (o.items || []).forEach((i: number) => e.books.add(i));
      if (o.createdAt < e.first) e.first = o.createdAt;
      if (o.createdAt > e.last) e.last = o.createdAt;
      e.currencies.add(o.currencyPaid || "INR");
      byUser.set(k, e);
    }

    const emails = (subs as any[]).map((s) => s.email);
    const userIds = Array.from(byUser.keys());
    const users: any[] = await User.find(
      { $or: [{ email: { $in: emails } }, { _id: { $in: userIds } }] },
      { fullName: 1, email: 1, createdAt: 1, purchasedBooks: 1, referralCode: 1, referredBy: 1, isVerified: 1 }
    ).lean();
    const userByEmail = new Map(users.map((u) => [String(u.email).toLowerCase(), u]));
    const userById = new Map(users.map((u) => [String(u._id), u]));
    const subByEmail = new Map((subs as any[]).map((s) => [s.email, s]));

    const now = Date.now();
    const signups = (subs as any[]).map((s) => {
      const u = (s.userId && userById.get(String(s.userId))) || userByEmail.get(s.email);
      const paid = u ? byUser.get(String(u._id)) : undefined;
      const boughtAfter = paid && paid.last >= s.createdAt;
      return {
        email: s.email,
        name: s.name || u?.fullName || "",
        source: s.source || "site",
        signedUpAt: s.createdAt,
        hasAccount: Boolean(u),
        unsubscribed: Boolean(s.unsubscribed),
        customer: Boolean(boughtAfter),
        orders: paid?.orders || 0,
        spentInr: Math.round((paid?.spentInr || 0) * 100) / 100,
      };
    });

    const customers = userIds
      .map((id) => {
        const u = userById.get(id);
        const p = byUser.get(id)!;
        return {
          name: u?.fullName || "",
          email: u?.email || "(account deleted)",
          joinedAt: u?.createdAt,
          orders: p.orders,
          books: p.books.size,
          spentInr: Math.round(p.spentInr * 100) / 100,
          firstPurchase: p.first,
          lastPurchase: p.last,
          currencies: Array.from(p.currencies),
          freeBookSubscriber: u ? subByEmail.has(String(u.email).toLowerCase()) : false,
          referred: Boolean(u?.referredBy),
        };
      })
      .sort((a, b) => +new Date(b.lastPurchase) - +new Date(a.lastPurchase));

    const since = (days: number) => signups.filter((s) => now - +new Date(s.signedUpAt) <= days * DAY).length;
    const bySource: Record<string, number> = {};
    signups.forEach((s) => { bySource[s.source] = (bySource[s.source] || 0) + 1; });
    const converted = signups.filter((s) => s.customer);

    // Sign-ups per day for the last 30 days.
    const daily: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * DAY).toISOString().slice(0, 10);
      daily.push({ date: d, count: 0 });
    }
    const idx = new Map(daily.map((d, i) => [d.date, i]));
    signups.forEach((s) => { const k = new Date(s.signedUpAt).toISOString().slice(0, 10); const i = idx.get(k); if (i !== undefined) daily[i].count++; });

    return NextResponse.json({
      giftBook: GIFT_BOOK.title,
      stats: {
        signups: signups.length,
        last7: since(7),
        last30: since(30),
        withAccount: signups.filter((s) => s.hasAccount).length,
        converted: converted.length,
        conversionRate: signups.length ? Math.round((converted.length / signups.length) * 1000) / 10 : 0,
        revenueFromSubscribersInr: Math.round(converted.reduce((a, s) => a + s.spentInr, 0) * 100) / 100,
        customers: customers.length,
        totalRevenueInr: Math.round(customers.reduce((a, c) => a + c.spentInr, 0) * 100) / 100,
        bySource,
      },
      daily,
      signups,
      customers,
    });
  } catch (e) {
    console.error("Admin audience error:", e);
    return NextResponse.json({ error: "Could not load audience data" }, { status: 500 });
  }
}
