import { NextResponse } from "next/server";
import { getAllBooks, toSummary } from "@/lib/books";

// The catalogue is cached (see lib/books.ts) and refreshed every minute or
// immediately after an admin edit. Only the small listing fields are sent.
export const revalidate = 60;

export async function GET() {
  try {
    const books = (await getAllBooks()).map(toSummary);
    return NextResponse.json(
      { books },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Books API error:", error);
    return NextResponse.json({ error: "Unable to load books" }, { status: 500 });
  }
}
