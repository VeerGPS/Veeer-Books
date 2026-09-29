import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import { BundleModel } from "@/models";
import { BOOKS_CACHE_TAG, getAllBooks, toSummary, type BookSummary } from "@/lib/books";

export const runtime = "nodejs";
// Dynamic so edits show at once; the data below is cached and invalidated on every admin save.
export const dynamic = "force-dynamic";

const loadBundles = unstable_cache(
  async () => {
    await connectDB();
    const [bundles, books] = await Promise.all([
      BundleModel.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
      getAllBooks(),
    ]);
    const byId = new Map(books.map((b) => [b.id, toSummary(b)]));

    return bundles.map((bundle) => {
      const includedBooks = (bundle.bookIds || [])
        .map((id: number) => byId.get(id))
        .filter(Boolean) as BookSummary[];
      const calculatedOriginal = includedBooks.reduce((sum, b) => sum + (b.price || 0), 0);
      return {
        _id: bundle._id.toString(),
        slug: bundle.slug,
        title: bundle.title,
        description: bundle.description || "",
        bookIds: bundle.bookIds,
        originalPrice: bundle.originalPrice || calculatedOriginal,
        bundlePrice: bundle.bundlePrice,
        badge: bundle.badge || "LIMITED TIME OFFER",
        isActive: bundle.isActive,
        books: includedBooks,
      };
    });
  },
  ["active-bundles-v2"],
  { revalidate: 60, tags: ["bundles", BOOKS_CACHE_TAG] }
);

export async function GET() {
  try {
    const bundles = await loadBundles();
    return NextResponse.json(
      { bundles },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } }
    );
  } catch (error) {
    console.error("GET /api/bundles error:", (error as Error).message);
    // No database → simply no offers (don't break the header).
    return NextResponse.json({ bundles: [] });
  }
}
