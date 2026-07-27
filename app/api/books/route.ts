import { NextResponse } from "next/server";
import { getAllBooks } from "@/lib/books";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const books = await getAllBooks();
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Books API error:", error);
    return NextResponse.json(
      { error: "Unable to load books" },
      { status: 500 }
    );
  }
}
