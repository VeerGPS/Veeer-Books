import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import { Review } from "@/models";

export type ReviewSummary = { count: number; average: number; breakdown: number[] };
export type PublicReview = { id: string; name: string; rating: number; title?: string; body: string; verified: boolean; createdAt: string };

export const REVIEWS_TAG = "reviews";

export function displayName(full?: string) {
  const parts = String(full || "Reader").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

async function load(bookId: number) {
  try {
    await connectDB();
    const docs: any[] = await Review.find({ bookId, status: "published" }).sort({ createdAt: -1 }).limit(200).lean();
    const breakdown = [0, 0, 0, 0, 0];
    docs.forEach((d) => { breakdown[Math.min(5, Math.max(1, d.rating)) - 1]++; });
    const count = docs.length;
    const average = count ? Math.round((docs.reduce((s, d) => s + d.rating, 0) / count) * 10) / 10 : 0;
    const reviews: PublicReview[] = docs.slice(0, 30).map((d) => ({
      id: String(d._id), name: d.name, rating: d.rating, title: d.title || undefined, body: d.body, verified: !!d.verified, createdAt: new Date(d.createdAt).toISOString(),
    }));
    return { summary: { count, average, breakdown } as ReviewSummary, reviews };
  } catch {
    return { summary: { count: 0, average: 0, breakdown: [0, 0, 0, 0, 0] }, reviews: [] as PublicReview[] };
  }
}

/** Published reviews for a book (cached; refreshed when a review is posted or moderated). */
export const getBookReviews = unstable_cache(load, ["book-reviews-v1"], { revalidate: 300, tags: [REVIEWS_TAG] });
