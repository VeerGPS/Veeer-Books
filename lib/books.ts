import { connectDB } from "@/lib/mongoose";
import { BookModel } from "@/models";
import { readFile } from "fs/promises";
import path from "path";

// Single source of truth for the book catalogue.
// Mirrors the BOOKS array from the original logic.js / cart.html
// so that *every* numeric ID and price is preserved exactly.
//
// IMPORTANT: Do NOT change the numeric `id` values — they are stored in
// MongoDB on user.purchasedBooks and order.items. Re-numbering would
// orphan existing data.

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
  cover: string;            // path under /public
  reader: string;           // path under /public/readers (the standalone reader HTML)
  pdf: string;              // path under /public/books
  description: string;
  highlights?: string[];    // optional bullet list shown on product page
  htmlContent?: string;
};

export const BOOKS: Book[] = [
  {
    id: 1,
    slug: "the-circle-of-ash",
    title: "The Circle of Ash: Where Truth Refuses to Burn",
    author: "Veer Sukhadiya",
    price: 180,
    color: "#2c3e50",
    accent: "#1a252f",
    genre: "Mystery Fiction",
    pages: 104,
    cover: "/images/the-circle-of-ash.png",
    reader: "/readers/the-circle-of-ash.html",
    pdf: "/books/The%20Circle%20of%20Ash%20.pdf",
    description:
      "A suspense-driven story where every clue deepens the mystery and every chapter pulls you closer to a hidden truth. If you enjoy psychological tension, layered reveals, and emotionally charged storytelling, this title is built for you.",
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
    color: "#2d5a3d",
    accent: "#1a3a27",
    genre: "Self-Help / Productivity",
    pages: 23,
    cover: "/images/1-percent-rule.png",
    reader: "/readers/the-1-percent-rule.html",
    pdf: "/books/The_1_Percent_Rule_.pdf",
    description:
      "A compact guide focused on tiny daily improvements that compound into major long-term change.",
  },
  {
    id: 3,
    slug: "the-shattered-sky",
    title: "The Shattered Sky",
    author: "Veer Sukhadiya",
    price: 110,
    color: "#5b8fc5",
    accent: "#252830",
    genre: "Fiction",
    pages: 52,
    cover: "/images/shattered-sky.jpg",
    reader: "/readers/the-shattered-sky.html",
    pdf: "/books/The_Shattered_Sky.pdf",
    description:
      "A fiction journey through a fractured world where resilience and imagination collide.",
  },
  {
    id: 4,
    slug: "fairy-tales-for-kids",
    title: "Fairy Tales: For Kids",
    author: "Veer Sukhadiya",
    price: 99,
    color: "#e67e22",
    accent: "#1e1e2e",
    genre: "Children's Literature",
    pages: 32,
    cover: "/images/fairy-tales.jpg",
    reader: "/readers/fairy-tales-for-kids.html",
    pdf: "/books/Fairy%20Tales.pdf",
    description:
      "A colorful collection of child-friendly stories designed to entertain, inspire, and build imagination.",
  },
  {
    id: 5,
    slug: "the-student-success-system",
    title: "The Student Success System",
    author: "Veer Sukhadiya",
    price: 135,
    color: "#c5a059",
    accent: "#2b2b2b",
    genre: "Self-Help / Productivity",
    pages: 78,
    cover: "/images/student-success.png",
    reader: "/readers/the-student-success-system.html",
    pdf: "/books/The%20Student%20Success%20System.pdf",
    description:
      "A complete student-focused system for mastering time, reducing burnout, and improving academic performance.",
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
    pages: 65,
    cover: "/images/The Art & Science of Prompting.png",
    reader: "/readers/The_Art_and_Science_of_Prompting_Reader-1.html",
    pdf: "/books/The Art and Science of Prompting (1).pdf",
    description:
      "Master the art of AI prompt engineering. A practical guide to crafting effective prompts, unlocking LLM potential, and building intelligent AI workflows.",
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

function resolveBookCover(cover?: string): string {
  if (cover && cover.trim() && cover !== "/images/default-book.png") return cover;
  return "/images/default-book.svg";
}

function resolveBookReader(reader?: string, slug?: string, title?: string): string {
  const cleanTitle = (title || "").toLowerCase();
  const cleanSlug = (slug || "").toLowerCase();

  if (cleanSlug.includes("circle") || cleanTitle.includes("circle of ash")) {
    return "/readers/the-circle-of-ash.html";
  }
  if (cleanSlug.includes("prompting") || cleanTitle.includes("prompting")) {
    return "/readers/The_Art_and_Science_of_Prompting_Reader-1.html";
  }
  if (cleanSlug.includes("percent") || cleanTitle.includes("1%")) {
    return "/readers/the-1-percent-rule.html";
  }
  if (cleanSlug.includes("shattered") || cleanTitle.includes("shattered")) {
    return "/readers/the-shattered-sky.html";
  }
  if (cleanSlug.includes("fairy") || cleanTitle.includes("fairy")) {
    return "/readers/fairy-tales-for-kids.html";
  }
  if (cleanSlug.includes("student") || cleanTitle.includes("student")) {
    return "/readers/the-student-success-system.html";
  }

  if (reader && reader.trim() && reader !== "/readers/default-reader.html") {
    return reader;
  }
  if (slug) {
    return `/readers/${slug}.html`;
  }
  return "/readers/default-reader.html";
}

export async function getAllBooks(): Promise<Book[]> {
  try {
    await connectDB();
    const docs = await BookModel.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    if (!docs.length) return BOOKS;

    return Promise.all(
      docs.map(async (doc) => ({
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        author: doc.author,
        price: resolveBookPrice(doc),
        actualPrice: doc.actualPrice || resolveBookPrice(doc),
        color: doc.color || "#2c3e50",
        accent: doc.accent || "#1a252f",
        genre: doc.genre || "General",
        pages: doc.pages || 0,
        cover: resolveBookCover(doc.cover),
        reader: resolveBookReader(doc.reader, doc.slug, doc.title),
        pdf: doc.pdf || "/books/default-book.pdf",
        description: doc.description || "",
        highlights: doc.highlights || [],
        htmlContent: await resolveHtmlContent(doc.htmlContent),
      }))
    );
  } catch (error) {
    console.error("getAllBooks error:", error);
    return BOOKS;
  }
}

export async function getBookBySlugFromDB(slug: string): Promise<Book | null> {
  try {
    await connectDB();
    const doc = await BookModel.findOne({ slug, isActive: true }).lean();
    if (!doc) {
      return getBookBySlug(slug) || null;
    }
    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      author: doc.author,
      price: resolveBookPrice(doc),
      actualPrice: doc.actualPrice || resolveBookPrice(doc),
      color: doc.color || "#2c3e50",
      accent: doc.accent || "#1a252f",
      genre: doc.genre || "General",
      pages: doc.pages || 0,
      cover: resolveBookCover(doc.cover),
      reader: resolveBookReader(doc.reader, doc.slug, doc.title),
      pdf: doc.pdf || "/books/default-book.pdf",
      description: doc.description || "",
      highlights: doc.highlights || [],
      htmlContent: await resolveHtmlContent(doc.htmlContent),
    };
  } catch (error) {
    console.error("getBookBySlugFromDB error:", error);
    return getBookBySlug(slug) || null;
  }
}
