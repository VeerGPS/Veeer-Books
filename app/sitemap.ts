import type { MetadataRoute } from "next";
import { getAllBooks } from "@/lib/books";
import { SITE_URL } from "@/lib/site";
import { connectDB } from "@/lib/mongoose";
import { AuthorProfile } from "@/models";

export const revalidate = 3600;

const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, freq: "daily" },
  { path: "/bundles", priority: 0.8, freq: "weekly" },
  { path: "/best-sellers", priority: 0.8, freq: "weekly" },
  { path: "/new-arrivals", priority: 0.8, freq: "weekly" },
  { path: "/publish", priority: 0.8, freq: "monthly" },
  { path: "/publishing-agreement", priority: 0.3, freq: "yearly" },
  { path: "/help-centre", priority: 0.4, freq: "monthly" },
  { path: "/contact-us", priority: 0.4, freq: "yearly" },
  { path: "/reading-apps", priority: 0.3, freq: "yearly" },
  { path: "/gift-cards", priority: 0.3, freq: "yearly" },
  { path: "/returns", priority: 0.2, freq: "yearly" },
  { path: "/terms", priority: 0.2, freq: "yearly" },
  { path: "/privacy", priority: 0.2, freq: "yearly" },
  { path: "/cookies", priority: 0.1, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((s) => ({
    url: `${SITE_URL}${s.path}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  const books = await getAllBooks().catch(() => []);
  const authorSlugs = new Set<string>();
  for (const b of books) {
    entries.push({ url: `${SITE_URL}/product/${b.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
    if (b.authorSlug) authorSlugs.add(b.authorSlug);
  }

  try {
    if (process.env.MONGO_URI) {
      await connectDB();
      const authors = await AuthorProfile.find({ status: "active" }, { slug: 1 }).limit(5000).lean();
      authors.forEach((a: any) => a.slug && authorSlugs.add(a.slug));
    }
  } catch {
    /* sitemap still works with book authors only */
  }
  authorSlugs.forEach((slug) => entries.push({ url: `${SITE_URL}/author/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 }));

  return entries;
}
