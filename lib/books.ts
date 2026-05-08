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
  color: string;            // background accent for cover
  accent: string;
  genre: string;
  pages: number;
  cover: string;            // path under /public
  reader: string;           // path under /public/readers (the standalone reader HTML)
  pdf: string;              // path under /public/books
  description: string;
  highlights?: string[];    // optional bullet list shown on product page
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
];

// Convenience lookups
export const getBookById = (id: number): Book | undefined =>
  BOOKS.find((b) => b.id === id);

export const getBookBySlug = (slug: string): Book | undefined =>
  BOOKS.find((b) => b.slug === slug);
