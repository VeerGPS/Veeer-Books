import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { BundleModel, BookModel } from "@/models";
import { BOOKS } from "@/lib/books";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const bundles = await BundleModel.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const dbBooks = await BookModel.find({ isActive: true }).lean().catch(() => []);

    const allBooksMap = new Map();
    BOOKS.forEach((b) => allBooksMap.set(b.id, b));
    dbBooks.forEach((b) => allBooksMap.set(b.id, b));

    const populatedBundles = bundles.map((bundle) => {
      const includedBooks = (bundle.bookIds || [])
        .map((id) => allBooksMap.get(id))
        .filter(Boolean);

      const calculatedOriginal = includedBooks.reduce((sum, b) => sum + (b.price || b.sellingPrice || 0), 0);

      return {
        _id: bundle._id.toString(),
        slug: bundle.slug,
        title: bundle.title,
        description: bundle.description || "",
        bookIds: bundle.bookIds,
        originalPrice: bundle.originalPrice || calculatedOriginal,
        bundlePrice: bundle.bundlePrice,
        badge: bundle.badge || "🔥 LIMITED TIME OFFER",
        isActive: bundle.isActive,
        books: includedBooks,
      };
    });

    return NextResponse.json({ bundles: populatedBundles });
  } catch (error) {
    console.error("GET /api/bundles error:", error);
    return NextResponse.json({ error: "Unable to fetch bundle offers" }, { status: 500 });
  }
}
