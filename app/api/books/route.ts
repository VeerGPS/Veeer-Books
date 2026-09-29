import { NextResponse } from "next/server";
import { getAllBooks, toSummary } from "@/lib/books";

// The catalogue is cached (see lib/books.ts) and refreshed every minute or
// immediately after an admin edit. Only the small listing fields are sent.
// Dynamic so admin price changes show at once; the catalogue itself is still cached (and
// invalidated on every admin save) inside getAllBooks, so this stays fast.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const books = (await getAllBooks()).map(toSummary);
    return NextResponse.json(
      { books },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } }
    );
  } catch (error) {
    console.error("Books API error:", error);
    return NextResponse.json({ error: "Unable to load books" }, { status: 500 });
  }
}
