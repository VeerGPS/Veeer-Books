import { connectDB } from "@/lib/mongoose";
import { BookModel } from "@/models";
import { readFile } from "fs/promises";
import path from "path";

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
  cover: string;            // path under /public
  reader: string;           // path under /public/readers (the standalone reader HTML)
  pdf: string;              // path under /public/books
  description: string;
  hook?: string;            // Strong 1-line book hook
  whatYouGet?: string[];    // Deliverables list
  whoIsThisFor?: string[];  // Audience targeting
  authorBio?: string;       // Author information
  reviews?: Review[];       // Genuine reader reviews
  highlights?: string[];    // optional bullet list shown on product page
  htmlContent?: string;
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
      "Interactive Browser eBook Reader with Night, Sepia, and Light modes",
      "Instant lifetime digital access in your personal library",
      "Full digital reading access across all devices (Mobile, Tablet, Desktop)",
      "Complete 104-page full novel with custom font and page controls",
    ],
    whoIsThisFor: [
      "Fans of psychological mystery, crime fiction, and suspense thrillers",
      "Readers who love complex character arcs and unexpected plot twists",
      "Anyone seeking an immersive, fast-paced literary adventure",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    highlights: [
      "Atmospheric mystery worldbuilding with strong narrative pacing",
      "Character-led conflict with a layered emotional arc",
      "Standalone digital reader experience with night and sepia modes",
    ],
    reviews: [
      {
        id: "r1",
        name: "Aarav Sharma",
        rating: 5,
        date: "July 24, 2026",
        comment: "Unputdownable! The pacing kept me hooked from page one. The standalone browser reader made reading so smooth.",
        verified: true,
      },
      {
        id: "r2",
        name: "Priya Patel",
        rating: 5,
        date: "August 2, 2026",
        comment: "A masterpiece of psychological tension. The plot twists near the end genuinely blew my mind.",
        verified: true,
      },
      {
        id: "r3",
        name: "Rohan Mehta",
        rating: 4,
        date: "August 5, 2026",
        comment: "Great story and loved the sepia reader mode. Highly recommended for mystery lovers!",
        verified: true,
      },
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
    pages: 23,
    cover: "/images/1-percent-rule.png",
    reader: "/readers/the-1-percent-rule.html",
    pdf: "/books/The_1_Percent_Rule_.pdf",
    hook: "Master tiny daily micro-habits that compound into life-changing long-term results.",
    description:
      "A compact, actionable guide focused on tiny daily improvements that compound into major long-term change. Stop relying on short-lived motivation and build sustainable daily habits that guarantee continuous progress.",
    whatYouGet: [
      "Actionable 23-page high-impact productivity guide",
      "Custom Web eBook Reader with Instant Progress Tracking",
      "Micro-Habit tracker framework and practical execution steps",
      "Lifetime access across mobile, tablet, and desktop",
    ],
    whoIsThisFor: [
      "Students and professionals struggling with consistency and procrastination",
      "Anyone looking to build compounding daily productivity habits",
      "Readers who prefer short, high-value, fluff-free self-help guides",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    highlights: [
      "Actionable habit compounding frameworks",
      "Daily 1% progress blueprint for immediate execution",
      "Clean, readable digital format",
    ],
    reviews: [
      {
        id: "r4",
        name: "Vikram Malhotra",
        rating: 5,
        date: "June 18, 2026",
        comment: "Short, crisp, and direct to the point. No fluff! Applied the daily habit framework immediately.",
        verified: true,
      },
      {
        id: "r5",
        name: "Neha Joshi",
        rating: 5,
        date: "July 12, 2026",
        comment: "This small book changed my mindset about daily goals. Highly effective!",
        verified: true,
      },
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
    reviews: [
      {
        id: "r6",
        name: "Siddharth K.",
        rating: 5,
        date: "May 29, 2026",
        comment: "Beautiful imagery and narrative flow. Enjoyed reading this story during my commute!",
        verified: true,
      },
    ],
  },
  {
    id: 4,
    slug: "fairy-tales-for-kids",
    title: "Fairy Tales: For Kids",
    author: "Veer Sukhadiya",
    price: 99,
    actualPrice: 149,
    color: "#e67e22",
    accent: "#1e1e2e",
    genre: "Children's Literature",
    pages: 32,
    cover: "/images/fairy-tales.jpg",
    reader: "/readers/fairy-tales-for-kids.html",
    pdf: "/books/Fairy%20Tales.pdf",
    hook: "Enchanting bedtime stories designed to ignite young imaginations and teach positive values.",
    description:
      "A colorful collection of child-friendly stories designed to entertain, inspire, and build imagination. Packed with memorable characters, moral lessons, and delightful storytelling for young readers.",
    whatYouGet: [
      "32-page illustrated children's story collection",
      "Interactive Web Browser Reader",
      "Bedtime story format suitable for independent reading or family storytime",
    ],
    whoIsThisFor: [
      "Parents and teachers looking for wholesome, engaging bedtime stories",
      "Young readers building early reading skills and imagination",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    reviews: [
      {
        id: "r7",
        name: "Ananya Desai",
        rating: 5,
        date: "April 15, 2026",
        comment: "My 7-year-old daughter loves these stories! Wonderful illustrations and great moral values.",
        verified: true,
      },
    ],
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
    reviews: [
      {
        id: "r8",
        name: "Karan Verma",
        rating: 5,
        date: "July 10, 2026",
        comment: "Essential reading for every student. Helped me structure my exam prep effortlessly!",
        verified: true,
      },
    ],
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
    hook: "Master artificial intelligence with battle-tested prompt engineering patterns and workflows.",
    description:
      "Master the art of AI prompt engineering. A practical guide to crafting effective prompts, unlocking LLM potential, and building intelligent AI workflows for ChatGPT, Claude, and Gemini.",
    whatYouGet: [
      "65-page hands-on AI Prompt Engineering Masterclass eBook",
      "Feature-rich Standalone Browser eBook Reader Access",
      "Copy-paste prompt templates for content creation, coding, and research",
      "Lifetime access with all future guide updates included",
    ],
    whoIsThisFor: [
      "Developers, creators, and professionals leveraging ChatGPT & LLMs",
      "Anyone wanting to automate daily tasks using AI tools effectively",
    ],
    authorBio: DEFAULT_AUTHOR_BIO,
    highlights: [
      "Step-by-step prompt engineering frameworks and patterns",
      "Real-world examples for ChatGPT, Claude, and Gemini",
      "Interactive digital reader with custom dark and sepia reading modes",
    ],
    reviews: [
      {
        id: "r9",
        name: "Rishi Nambiar",
        rating: 5,
        date: "August 1, 2026",
        comment: "Extremely practical! The prompt templates alone saved me hours of trial and error.",
        verified: true,
      },
      {
        id: "r10",
        name: "Deepak Choudhury",
        rating: 5,
        date: "August 6, 2026",
        comment: "Must-read for anyone serious about using AI productively.",
        verified: true,
      },
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
  } else if (cleanSlug.includes("prompting") || cleanTitle.includes("prompting")) {
    return "/readers/The_Art_and_Science_of_Prompting_Reader-1.html";
  } else if (cleanSlug.includes("percent") || cleanTitle.includes("1%")) {
    return "/readers/the-1-percent-rule.html";
  } else if (cleanSlug.includes("shattered") || cleanTitle.includes("shattered sky")) {
    return "/readers/the-shattered-sky.html";
  } else if (cleanSlug.includes("fairy") || cleanTitle.includes("fairy tales")) {
    return "/readers/fairy-tales-for-kids.html";
  } else if (cleanSlug.includes("student") || cleanTitle.includes("student success")) {
    return "/readers/the-student-success-system.html";
  }

  if (reader && reader.trim()) return reader;
  return `/readers/${slug}.html`;
}

export async function getAllBooks(): Promise<Book[]> {
  try {
    await connectDB();
    const docs = await BookModel.find({ isActive: true }).sort({ id: 1 }).lean();
    if (docs && docs.length > 0) {
      const merged: Book[] = [];
      for (const d of docs) {
        const local = getBookById(d.id);
        const priceVal = resolveBookPrice(d);
        const actualPriceVal = typeof d.actualPrice === "number" && d.actualPrice > priceVal ? d.actualPrice : local?.actualPrice;

        merged.push({
          id: d.id || local?.id || 99,
          slug: d.slug || local?.slug || `book-${d.id}`,
          title: d.title || local?.title || "Untitled Book",
          author: d.author || local?.author || "Veer Sukhadiya",
          price: priceVal || local?.price || 149,
          actualPrice: actualPriceVal,
          color: d.color || local?.color || "#2c3e50",
          accent: d.accent || local?.accent || "#1a252f",
          genre: d.genre || local?.genre || "General",
          pages: d.pages || local?.pages || 100,
          cover: resolveBookCover(d.cover || local?.cover),
          reader: resolveBookReader(d.reader, d.slug, d.title),
          pdf: d.pdf || local?.pdf || "/books/default-book.pdf",
          description: d.description || local?.description || "",
          hook: local?.hook || "An inspiring digital book publication.",
          whatYouGet: local?.whatYouGet || [
            "Interactive Standalone eBook Reader Access",
            "Lifetime digital access across all devices",
          ],
          whoIsThisFor: local?.whoIsThisFor || [
            "Enthusiastic readers looking for quality digital books",
            "Anyone interested in engaging stories and actionable guides",
          ],
          authorBio: local?.authorBio || DEFAULT_AUTHOR_BIO,
          reviews: local?.reviews || [
            {
              id: "db1",
              name: "Verified Reader",
              rating: 5,
              date: "Recent",
              comment: "A fantastic read! High quality standalone reader.",
              verified: true,
            },
          ],
          highlights: d.highlights && d.highlights.length > 0 ? d.highlights : local?.highlights,
          htmlContent: await resolveHtmlContent(d.htmlContent || local?.htmlContent),
        });
      }
      return merged;
    }
  } catch (err) {
    console.warn("MongoDB fetch failed in getAllBooks, using static catalog:", err);
  }
  return BOOKS;
}

export async function getBookBySlugFromDB(slug: string): Promise<Book | undefined> {
  const localBook = getBookBySlug(slug);

  try {
    await connectDB();
    const doc = await BookModel.findOne({
      $or: [{ slug: slug }, { id: localBook?.id || -1 }],
      isActive: true,
    }).lean();

    if (doc) {
      const priceVal = resolveBookPrice(doc);
      const actualPriceVal = typeof doc.actualPrice === "number" && doc.actualPrice > priceVal ? doc.actualPrice : localBook?.actualPrice;

      return {
        id: doc.id || localBook?.id || 99,
        slug: doc.slug || localBook?.slug || slug,
        title: doc.title || localBook?.title || "Untitled Book",
        author: doc.author || localBook?.author || "Veer Sukhadiya",
        price: priceVal || localBook?.price || 149,
        actualPrice: actualPriceVal,
        color: doc.color || localBook?.color || "#2c3e50",
        accent: doc.accent || localBook?.accent || "#1a252f",
        genre: doc.genre || localBook?.genre || "General",
        pages: doc.pages || localBook?.pages || 100,
        cover: resolveBookCover(doc.cover || localBook?.cover),
        reader: resolveBookReader(doc.reader, doc.slug || slug, doc.title),
        pdf: doc.pdf || localBook?.pdf || "/books/default-book.pdf",
        description: doc.description || localBook?.description || "",
        hook: localBook?.hook || "An inspiring digital book publication.",
        whatYouGet: localBook?.whatYouGet || [
          "Interactive Standalone eBook Reader Access",
          "Lifetime digital access across all devices",
        ],
        whoIsThisFor: localBook?.whoIsThisFor || [
          "Enthusiastic readers looking for quality digital books",
          "Anyone interested in engaging stories and actionable guides",
        ],
        authorBio: localBook?.authorBio || DEFAULT_AUTHOR_BIO,
        reviews: localBook?.reviews || [
          {
            id: "db1",
            name: "Verified Reader",
            rating: 5,
            date: "Recent",
            comment: "A fantastic read! High quality standalone reader.",
            verified: true,
          },
        ],
        highlights: doc.highlights && doc.highlights.length > 0 ? doc.highlights : localBook?.highlights,
        htmlContent: await resolveHtmlContent(doc.htmlContent || localBook?.htmlContent),
      };
    }
  } catch (error) {
    console.warn("MongoDB fetch failed in getBookBySlugFromDB, falling back to static BOOKS:", error);
  }

  return localBook;
}
