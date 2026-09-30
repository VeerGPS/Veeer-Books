import { connectDB } from "@/lib/mongoose";
import { BookModel } from "@/models";
import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Single source of truth for the book catalogue.
// Mirrors the BOOKS array from the original logic.js / cart.html
// so that *every* numeric ID and price is preserved exactly.

export type Review = {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
};

export type Book = {
  id: number;
  slug: string;             // URL-friendly identifier used in /product/[slug]
  title: string;
  author: string;
  price: number;            // INR
  actualPrice?: number;     // optional admin-managed original price
  color: string;            // background accent for cover
  accent: string;
  genre: string;
  pages: number;
  cover: string;            // path under /public or /api/uploads
  reader: string;           // path under /public/readers or /api/uploads/readers
  pdf: string;              // path under /public/books or /api/uploads/books
  description: string;
  hook?: string;            // Strong 1-line book hook
  whatYouGet?: string[];    // Deliverables list
  whoIsThisFor?: string[];  // Audience targeting
  authorBio?: string;       // Author information
  authorId?: string;        // External author ID if applicable
  authorSlug?: string;      // Slug for /author/[slug]
  publisherType?: "in_house" | "external_author";
  highlights?: string[];    // optional bullet list shown on product page
  htmlContent?: string;
  /** ISO date while a launch price is running (price is then the launch price). */
  launchEndsAt?: string;
  /** Regular price to return to after the launch offer. */
  regularPrice?: number;
  /** Optional admin-set prices for US / UK visitors. */
  foreign?: { USD?: number; GBP?: number };
};

export const DEFAULT_AUTHOR_BIO =
  "Veer Sukhadiya is a digital author and creator dedicated to writing compelling fiction, practical self-improvement guides, and cutting-edge technology resources. All publications feature high-quality interactive web readers optimized for all devices.";

export const BOOKS: Book[] = [
  {
    id: 1,
    slug: "the-circle-of-ash",
    title: "The Circle of Ash: Where Truth Refuses to Burn",
    author: "Veer Sukhadiya",
    price: 180,
    actualPrice: 249,
    color: "#2c3e50",
    accent: "#1a252f",
    genre: "Mystery Fiction",
    pages: 104,
    cover: "/images/the-circle-of-ash.png",
    reader: "/readers/the-circle-of-ash.html",
    pdf: "/books/The%20Circle%20of%20Ash%20.pdf",
    hook: "A gripping psychological mystery where every hidden secret deepens the tension.",
    description:
      "A suspense-driven story where every clue deepens the mystery and every chapter pulls you closer to a hidden truth. If you enjoy psychological tension, layered reveals, and emotionally charged storytelling, this title is built for you.",
    whatYouGet: [
      "Fast web reader with contents, search, bookmarks and Night, Sepia & Light modes",
      "Instant lifetime digital access in your personal library",
      "Full digital reading access across all devices (Mobile, Tablet, Desktop)",
      "Complete 104-page novel with zoom, 1-page, 2-page and scroll layouts",
    ],
    whoIsThisFor: [
      "Fans of psychological mystery, crime fiction, and suspense thrillers",
      "Readers who love complex character arcs and unexpected plot twists",
      "Anyone seeking an immersive, fast-paced literary adventure",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    publisherType: "in_house",
    highlights: [
      "Atmospheric mystery worldbuilding with strong narrative pacing",
      "Character-led conflict with a layered emotional arc",
      "Standalone digital reader experience with night and sepia modes",
    ],
  },
  {
    id: 2,
    slug: "the-1-percent-rule",
    title: "The 1% Rule",
    author: "Veer Sukhadiya",
    price: 110,
    actualPrice: 160,
    color: "#2d5a3d",
    accent: "#1a3a27",
    genre: "Self-Help / Productivity",
    pages: 114,
    cover: "/images/1-percent-rule.png",
    reader: "/readers/the-1-percent-rule.html",
    pdf: "/books/The_1_Percent_Rule_.pdf",
    hook: "Improve by one percent today, repeat tomorrow — and watch tiny actions compound into a better life.",
    description:
      "The new Expanded Edition of The 1% Rule: a practical guide to transforming your life with small, consistent steps. Learn why the smallest useful action beats the grand gesture, see the simple mathematics of compounding, and apply the 1% Rule to your health, learning, money, productivity, relationships and work.\n\nSixteen chapters across four parts include real-world examples, action steps, key takeaways, a 30-Day Blueprint with a daily tracker, and a personal 1% Life Plan you can start today.",
    whatYouGet: [
      "Expanded Edition — 114 pages, 16 chapters in four parts",
      "A 30-Day Blueprint with daily checklist, journaling prompts and tracker grid",
      "Action steps and a key takeaway at the end of every chapter",
      "Fast web reader with contents, search, bookmarks and night/sepia modes",
      "Lifetime access on mobile, tablet and desktop",
    ],
    whoIsThisFor: [
      "Students and professionals struggling with consistency and procrastination",
      "Anyone who wants habits that last longer than a burst of motivation",
      "Readers who like practical, example-driven self-help without the fluff",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    publisherType: "in_house",
    highlights: [
      "The math of compounding: why 1% better every day is 37.8× better in a year",
      "The 1% Rule applied to health, learning, money, productivity and relationships",
      "The science of small wins, breaking the 0% mindset, and the 1% Rule at work",
      "Build your own 1% Life Plan in four steps",
    ],
  },
  {
    id: 3,
    slug: "the-shattered-sky",
    title: "The Shattered Sky",
    author: "Veer Sukhadiya",
    price: 110,
    actualPrice: 175,
    color: "#5b8fc5",
    accent: "#252830",
    genre: "Fiction",
    pages: 52,
    cover: "/images/shattered-sky.jpg",
    reader: "/readers/the-shattered-sky.html",
    pdf: "/books/The_Shattered_Sky.pdf",
    hook: "A breathtaking fantasy saga where courage and imagination collide in a broken realm.",
    description:
      "A fiction journey through a fractured world where resilience and imagination collide. Follow a gripping narrative of survival, hope, and humanity against overwhelming odds.",
    whatYouGet: [
      "Complete 52-page digital fantasy story",
      "Instant Browser eBook Reader Access",
      "Full digital access with night and sepia reading modes",
    ],
    whoIsThisFor: [
      "Fantasy and speculative fiction enthusiasts",
      "Readers who appreciate rich worldbuilding and emotional storytelling",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    publisherType: "in_house",
  },
  {
    id: 4,
    slug: "fairy-tales-for-kids",
    title: "Fairy Tales for Kids",
    author: "Veer Sukhadiya",
    price: 99,
    actualPrice: 149,
    color: "#e67e22",
    accent: "#1e1e2e",
    genre: "Children's Literature",
    pages: 84,
    cover: "/images/fairy-tales-cover.jpg",
    reader: "/readers/fairy-tales-for-kids.html",
    pdf: "/books/Fairy%20Tales.pdf",
    hook: "Sixteen magical, fully illustrated stories from around the world — perfect for bedtime.",
    description:
      "The new illustrated edition: 16 magical stories from around the world, from Aladdin and the Lion and the Mouse to Birbal, Tenali Raman and two brand-new bedtime tales. Every story ends with a Story Treasure box — the lesson, questions to talk about and a Magic Word to learn — plus colouring pages, a story quiz and a reading tracker. For ages 4–8 and the grown-ups who read with them.",
    whatYouGet: [
      "New 84-page illustrated edition with 16 stories in four parts",
      "A Story Treasure box after every tale: the lesson, two talk-about questions and a Magic Word",
      "12 colouring pages, a Story Match Quiz and a “My Story Stars” reading tracker",
      "Read on any device in the fast web reader, with night and sepia modes",
    ],
    whoIsThisFor: [
      "Parents and teachers looking for wholesome, engaging bedtime stories",
      "Young readers building early reading skills and imagination",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    publisherType: "in_house",
  },
  {
    id: 5,
    slug: "the-student-success-system",
    title: "The Student Success System",
    author: "Veer Sukhadiya",
    price: 135,
    actualPrice: 199,
    color: "#c5a059",
    accent: "#2b2b2b",
    genre: "Self-Help / Productivity",
    pages: 78,
    cover: "/images/student-success.png",
    reader: "/readers/the-student-success-system.html",
    pdf: "/books/The%20Student%20Success%20System.pdf",
    hook: "The complete roadmap for students to master study routines, ace exams, and avoid academic burnout.",
    description:
      "A complete student-focused system for mastering time, reducing burnout, and improving academic performance. Contains proven exam preparation strategies, note-taking frameworks, and schedule blueprints.",
    whatYouGet: [
      "78-page comprehensive student productivity blueprint",
      "Interactive Custom Browser Reader",
      "Exam preparation templates and study routine schedules",
      "Lifetime digital access on phone, laptop, and tablet",
    ],
    whoIsThisFor: [
      "High school and university students preparing for exams",
      "Learners aiming to optimize study hours and conquer academic anxiety",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    publisherType: "in_house",
  },
  {
    id: 6,
    slug: "the-art-and-science-of-prompting",
    title: "The Art & Science of Prompting",
    author: "Veer Sukhadiya",
    price: 149,
    actualPrice: 199,
    color: "#1e1b4b",
    accent: "#312e81",
    genre: "AI / Technology",
    pages: 123,
    cover: "/images/The Art & Science of Prompting.png",
    reader: "/readers/The_Art_and_Science_of_Prompting_Reader-1.html",
    pdf: "/books/The Art and Science of Prompting (1).pdf",
    hook: "Master artificial intelligence with battle-tested prompt engineering patterns and workflows.",
    description:
      "Master the art of AI prompt engineering. A practical guide to crafting effective prompts, unlocking LLM potential, and building intelligent AI workflows for ChatGPT, Claude, and Gemini.",
    whatYouGet: [
      "123-page hands-on prompt engineering guide: 26 chapters in six parts plus a template library",
      "Feature-rich Standalone Browser eBook Reader Access",
      "Copy-paste prompt templates for content creation, coding, and research",
      "Lifetime access with all future guide updates included",
    ],
    whoIsThisFor: [
      "Developers, creators, and professionals leveraging ChatGPT & LLMs",
      "Anyone wanting to automate daily tasks using AI tools effectively",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    publisherType: "in_house",
    highlights: [
      "Step-by-step prompt engineering frameworks and patterns",
      "Real-world examples for ChatGPT, Claude, and Gemini",
      "Interactive digital reader with custom dark and sepia reading modes",
    ],
  },
];

// Convenience lookups
export const getBookById = (id: number): Book | undefined =>
  BOOKS.find((b) => b.id === id);

export const getBookBySlug = (slug: string): Book | undefined =>
  BOOKS.find((b) => b.slug === slug);

/** Cache tag used by admin routes to refresh the catalogue after edits. */
export const BOOKS_CACHE_TAG = "books";
/** How long (seconds) catalogue data is cached before it is re-read from the DB. */
export const BOOKS_REVALIDATE = 60;

async function resolveHtmlContent(htmlContent: string | undefined) {
  if (!htmlContent || !htmlContent.startsWith("/uploads/")) {
    return htmlContent;
  }

  try {
    const filePath = path.join(process.cwd(), "public", htmlContent.replace(/^\/+/, ""));
    return await readFile(filePath, "utf8");
  } catch (error) {
    console.warn("Unable to read stored book HTML file:", htmlContent, error);
    return htmlContent;
  }
}

function resolveBookPrice(doc: { sellingPrice?: number; price?: number; actualPrice?: number }): number {
  if (typeof doc.sellingPrice === "number" && doc.sellingPrice > 0) return doc.sellingPrice;
  if (typeof doc.price === "number" && doc.price > 0) return doc.price;
  if (typeof doc.actualPrice === "number" && doc.actualPrice > 0) return doc.actualPrice;
  return 0;
}

// Covers replaced by a new edition (the old image is still in the database record).
const REPLACED_COVERS: Record<string, string> = {
  "/images/fairy-tales.jpg": "/images/fairy-tales-cover.jpg",
  "/images/fairy-tales-2e.jpg": "/images/fairy-tales-cover.jpg",
};

// Old text still stored in the database for books that now have a new edition.
// Only exact old values are replaced, so later admin edits always win.
const REPLACED_TEXT: Record<string, true> = {
  "Fairy Tales: For Kids": true,
  "A colorful collection of child-friendly stories designed to entertain, inspire, and build imagination. Packed with memorable characters, moral lessons, and delightful storytelling for young readers.": true,
};
function freshText(dbValue: string | undefined, localValue: string | undefined) {
  if (dbValue && REPLACED_TEXT[dbValue.trim()] && localValue) return localValue;
  return dbValue || localValue;
}

function resolveBookCover(cover?: string): string {
  if (cover && REPLACED_COVERS[cover]) return REPLACED_COVERS[cover];
  if (cover && cover.trim() && cover !== "/images/default-book.png") return cover;
  return "/images/default-book.svg";
}

// The built-in books always use the shared fast reader in /public/readers.
const IN_HOUSE_READERS: Array<[RegExp, string]> = [
  [/circle/, "/readers/the-circle-of-ash.html"],
  [/prompting/, "/readers/the-art-and-science-of-prompting.html"],
  [/percent|1%/, "/readers/the-1-percent-rule.html"],
  [/shattered/, "/readers/the-shattered-sky.html"],
  [/fairy/, "/readers/fairy-tales-for-kids.html"],
  [/student/, "/readers/the-student-success-system.html"],
];

function resolveBookReader(reader?: string, slug?: string, title?: string): string {
  const key = `${(slug || "").toLowerCase()} ${(title || "").toLowerCase()}`;
  for (const [re, src] of IN_HOUSE_READERS) if (re.test(key)) return src;
  if (reader && reader.trim() && reader !== "/readers/default-reader.html") return reader;
  return `/readers/${slug}.html`;
}

type BookDoc = Record<string, any>;

/** Merge a database record with the built-in catalogue entry (DB wins for admin-managed fields). */
/** Active launch offer, if any: a lower price that runs until launchEndsAt. */
export function activeLaunch(d: { launchPrice?: number; launchEndsAt?: Date | string | null }, regular: number) {
  const ends = d.launchEndsAt ? new Date(d.launchEndsAt) : null;
  if (!ends || isNaN(+ends) || +ends <= Date.now()) return null;
  const lp = Number(d.launchPrice) || 0;
  if (lp <= 0 || lp >= regular) return null;
  return { price: lp, endsAt: ends.toISOString() };
}

function toBook(d: BookDoc, local: Book | undefined, slugHint?: string): Book {
  const regular = resolveBookPrice(d);
  const launch = activeLaunch(d, regular || local?.price || 0);
  const priceVal = launch ? launch.price : regular;
  const actualPriceVal = launch
    ? Math.max(Number(d.actualPrice) || 0, regular)
    : typeof d.actualPrice === "number" && d.actualPrice > priceVal ? d.actualPrice : local?.actualPrice;
  const slug = d.slug || local?.slug || slugHint || `book-${d.id}`;

  return {
    id: d.id || local?.id || 99,
    slug,
    title: freshText(d.title, local?.title) || "Untitled Book",
    author: d.author || local?.author || "Veer Sukhadiya",
    price: priceVal || local?.price || 149,
    actualPrice: actualPriceVal,
    color: d.color || local?.color || "#2c3e50",
    accent: d.accent || local?.accent || "#1a252f",
    genre: d.genre || local?.genre || "General",
    // Page count of built-in books follows the bundled reader edition.
    pages: local?.pages || d.pages || 100,
    cover: resolveBookCover(d.cover || local?.cover),
    reader: resolveBookReader(d.reader, slug, d.title),
    pdf: d.pdf || local?.pdf || "/books/default-book.pdf",
    description: freshText(d.description, local?.description) || "",
    hook: local?.hook,
    whatYouGet: local?.whatYouGet || [
      "Fast web reader with contents, search, bookmarks and night/sepia modes",
      "Lifetime digital access across all devices",
    ],
    whoIsThisFor: local?.whoIsThisFor || [
      "Readers looking for quality digital books",
      "Anyone interested in engaging stories and actionable guides",
    ],
    authorBio: d.authorBio || local?.authorBio || DEFAULT_AUTHOR_BIO,
    authorId: d.authorId ? d.authorId.toString() : undefined,
    authorSlug: d.authorSlug || undefined,
    publisherType: d.publisherType || "in_house",
    highlights: d.highlights && d.highlights.length > 0 ? d.highlights : local?.highlights,
    launchEndsAt: launch?.endsAt,
    regularPrice: launch ? regular : undefined,
    ...(Number(d.priceUSD) > 0 || Number(d.priceGBP) > 0
      ? { foreign: { USD: Number(d.priceUSD) || undefined, GBP: Number(d.priceGBP) || undefined } }
      : {}),
  };
}

// Everything except the (potentially huge) HTML body — listings never need it.
const LIST_PROJECTION = { htmlContent: 0, __v: 0 } as const;

// IMPORTANT: database errors are thrown *inside* the cached function so a
// temporary DB hiccup is never cached. (Previously the built-in fallback
// catalogue — with its original prices — was cached for a minute and baked
// into pages, which looked like admin price changes "reverting".)
const loadAllBooks = unstable_cache(
  async (): Promise<Book[]> => {
    await connectDB();
    const docs = await BookModel.find({ isActive: true }, LIST_PROJECTION).sort({ id: 1 }).lean();
    if (docs && docs.length > 0) {
      return docs.map((d) => toBook(d as BookDoc, getBookById((d as BookDoc).id)));
    }
    return BOOKS;
  },
  ["all-books-v3"],
  { revalidate: BOOKS_REVALIDATE, tags: [BOOKS_CACHE_TAG] }
);

/** All active books for listings (cached; no HTML body). Falls back to the built-in catalogue, uncached, if the DB is down. */
export const getAllBooks = cache(async (): Promise<Book[]> => {
  try {
    return await loadAllBooks();
  } catch (err) {
    console.warn("MongoDB fetch failed in getAllBooks, using static catalog (not cached):", (err as Error).message);
    return BOOKS;
  }
});

const loadBookBySlug = unstable_cache(
  async (slug: string, withHtml: boolean): Promise<Book | null> => {
    const localBook = getBookBySlug(slug);
    await connectDB(); // throws on DB errors so they are never cached
    const doc = await BookModel.findOne(
      { $or: [{ slug }, { id: localBook?.id ?? -1 }], isActive: true },
      withHtml ? { __v: 0 } : LIST_PROJECTION
    ).lean();
    if (doc) {
      const book = toBook(doc as BookDoc, localBook, slug);
      if (withHtml) book.htmlContent = await resolveHtmlContent((doc as BookDoc).htmlContent || localBook?.htmlContent);
      return book;
    }
    return localBook ?? null;
  },
  ["book-by-slug-v3"],
  { revalidate: BOOKS_REVALIDATE, tags: [BOOKS_CACHE_TAG] }
);

/**
 * One book by slug (cached, and de-duplicated within a request so
 * generateMetadata + the page share one lookup).
 * Pass `withHtml` only where the book's HTML body is actually rendered.
 */
export const getBookBySlugFromDB = cache(
  async (slug: string, withHtml = false): Promise<Book | undefined> => {
    try {
      return (await loadBookBySlug(slug, withHtml)) ?? undefined;
    } catch (error) {
      console.warn("MongoDB fetch failed in getBookBySlugFromDB, using static catalog (not cached):", (error as Error).message);
      return getBookBySlug(slug);
    }
  }
);

/** Small, client-safe shape for listings sent to the browser. */
export type BookSummary = Pick<
  Book,
  "id" | "slug" | "title" | "author" | "price" | "actualPrice" | "color" | "genre" | "pages" | "cover" | "reader" | "launchEndsAt" | "regularPrice" | "foreign"
>;

export function toSummary(b: Book): BookSummary {
  return {
    id: b.id, slug: b.slug, title: b.title, author: b.author, price: b.price, actualPrice: b.actualPrice,
    color: b.color, genre: b.genre, pages: b.pages, cover: b.cover, reader: b.reader,
    ...(b.launchEndsAt ? { launchEndsAt: b.launchEndsAt, regularPrice: b.regularPrice } : {}),
    ...(b.foreign ? { foreign: b.foreign } : {}),
  };
}
