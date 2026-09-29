// GET  /api/subscribe/claim?t=TOKEN — checks a gift link from the welcome email.
// POST /api/subscribe/claim {t}     — also saves the gift to the signed-in account.
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Subscriber, User } from "@/models";
import { getOptionalAuth } from "@/lib/auth";
import { GIFT_BOOK } from "@/lib/gift";

export const dynamic = "force-dynamic";

async function find(t: string) {
  if (!t || t.length < 16 || t.length > 64) return null;
  await connectDB();
  return Subscriber.findOne({ giftToken: t });
}

export async function GET(req: NextRequest) {
  const sub = await find(req.nextUrl.searchParams.get("t") || "").catch(() => null);
  if (!sub) return NextResponse.json({ ok: false, error: "This gift link isn’t valid." }, { status: 404 });
  return NextResponse.json({ ok: true, bookId: sub.giftBookId || GIFT_BOOK.id, slug: GIFT_BOOK.slug });
}

export async function POST(req: NextRequest) {
  const { t } = await req.json().catch(() => ({}));
  const sub = await find(String(t || "")).catch(() => null);
  if (!sub) return NextResponse.json({ ok: false, error: "This gift link isn’t valid." }, { status: 404 });
  const auth = getOptionalAuth(req);
  if (auth?.userId) {
    await User.updateOne({ _id: auth.userId }, { $addToSet: { purchasedBooks: sub.giftBookId || GIFT_BOOK.id } });
    if (!sub.userId) { sub.userId = auth.userId as any; await sub.save(); }
  }
  return NextResponse.json({ ok: true, bookId: sub.giftBookId || GIFT_BOOK.id, slug: GIFT_BOOK.slug, savedToAccount: Boolean(auth?.userId) });
}
