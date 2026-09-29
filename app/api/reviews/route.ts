// GET  /api/reviews?bookId=1        — published reviews + summary
// POST /api/reviews {bookId, rating, title, body} — owners of the book only (one review each, editable)
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import { Review, User } from "@/models";
import { requireAuth, getOptionalAuth } from "@/lib/auth";
import { REVIEWS_TAG, displayName, getBookReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const bookId = Number(req.nextUrl.searchParams.get("bookId"));
  if (!bookId) return NextResponse.json({ error: "bookId required" }, { status: 400 });
  const data = await getBookReviews(bookId);
  let mine = null;
  const auth = getOptionalAuth(req);
  if (auth) {
    try {
      await connectDB();
      const r: any = await Review.findOne({ bookId, userId: auth.userId }).lean();
      if (r) mine = { rating: r.rating, title: r.title, body: r.body, status: r.status };
    } catch { /* ignore */ }
  }
  return NextResponse.json({ ...data, mine });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json().catch(() => ({}));
    const bookId = Number(b.bookId);
    const rating = Math.round(Number(b.rating));
    const title = String(b.title || "").trim().slice(0, 100);
    const body = String(b.body || "").trim().slice(0, 3000);
    if (!bookId || rating < 1 || rating > 5) return NextResponse.json({ error: "Please choose a star rating." }, { status: 400 });
    if (body.length < 10) return NextResponse.json({ error: "Please write at least a sentence about the book." }, { status: 400 });

    await connectDB();
    const user: any = await User.findById(auth.userId, { fullName: 1, purchasedBooks: 1 }).lean();
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (!(user.purchasedBooks || []).includes(bookId)) {
      return NextResponse.json({ error: "Only readers who have this book in their library can review it." }, { status: 403 });
    }

    const existing: any = await Review.findOne({ bookId, userId: auth.userId }).lean();
    await Review.updateOne(
      { bookId, userId: auth.userId },
      {
        $set: { rating, title, body, name: displayName(user.fullName), verified: true, ...(existing?.status === "hidden" ? {} : { status: "published" }) },
      },
      { upsert: true }
    );
    revalidateTag(REVIEWS_TAG);
    return NextResponse.json({ ok: true, updated: Boolean(existing) });
  } catch (e) {
    console.error("Review error:", e);
    return NextResponse.json({ error: "Could not save your review" }, { status: 500 });
  }
}
