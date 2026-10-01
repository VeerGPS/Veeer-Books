// PATCH /api/admin/deals/book-offer {id, launchPrice, launchEndsAt} — a limited-time price for one book.
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";
import { connectDB } from "@/lib/mongoose";
import { BookModel } from "@/models";
import { BOOKS_CACHE_TAG } from "@/lib/books";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!isAdminPasswordValid(req.headers.get("x-admin-password"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, launchPrice, launchEndsAt } = await req.json().catch(() => ({}));
    const bookId = Number(id);
    if (!Number.isInteger(bookId)) return NextResponse.json({ error: "Missing book" }, { status: 400 });
    await connectDB();
    const book: any = await BookModel.findOne({ id: bookId }).lean();
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    const regular = Number(book.sellingPrice) > 0 ? book.sellingPrice : Number(book.price) > 0 ? book.price : Number(book.actualPrice) || 0;
    const lp = Number(launchPrice) || 0;
    const ends = launchEndsAt ? new Date(String(launchEndsAt)) : null;
    let update: Record<string, unknown>;
    if (lp > 0) {
      if (!ends || isNaN(+ends)) return NextResponse.json({ error: "Choose when the offer ends." }, { status: 400 });
      if (+ends <= Date.now()) return NextResponse.json({ error: "The end time is already in the past." }, { status: 400 });
      if (lp >= regular) return NextResponse.json({ error: `Offer price must be lower than the regular price (₹${regular}).` }, { status: 400 });
      update = { launchPrice: lp, launchEndsAt: ends };
    } else {
      update = { launchPrice: 0, launchEndsAt: null }; // end the offer
    }
    await BookModel.updateOne({ id: bookId }, { $set: update });
    revalidateTag(BOOKS_CACHE_TAG);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, message: lp > 0 ? "Offer is live." : "Offer ended." });
  } catch (e) {
    console.error("Book offer error:", e);
    return NextResponse.json({ error: "Could not save the offer" }, { status: 500 });
  }
}
