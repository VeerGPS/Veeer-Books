import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AuthorProfile, BookModel } from "@/models";
import { BOOKS } from "@/lib/books";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.toLowerCase().trim();
    if (!slug) {
      return NextResponse.json({ error: "Author slug is required" }, { status: 400 });
    }

    await connectDB();
    const profile = await AuthorProfile.findOne({ slug, status: "active" }).lean();

    // Check if Veer Sukhadiya default author profile
    if (!profile && (slug === "veer-sukhadiya" || slug === "veer")) {
      const inHouseBooks = await BookModel.find({ isActive: true }).lean();
      const booksList = inHouseBooks.length > 0 ? inHouseBooks : BOOKS;

      return NextResponse.json({
        author: {
          penName: "Veer Sukhadiya",
          slug: "veer-sukhadiya",
          biography:
            "Veer Sukhadiya is a digital author and creator dedicated to writing compelling fiction, practical self-improvement guides, and cutting-edge technology resources. All publications feature high-quality interactive web readers optimized for all devices.",
          profilePhoto: "/images/about.jpeg",
          website: "https://veeerbooks.in",
          authorType: "Individual Author",
          socialLinks: {},
        },
        books: booksList,
      });
    }

    if (!profile) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Fetch published books for this author
    const publishedBooks = await BookModel.find({
      $or: [{ authorId: profile._id }, { authorSlug: profile.slug }],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Sanitize author output to strictly public fields
    const publicAuthor = {
      penName: profile.penName,
      slug: profile.slug,
      biography: profile.biography || "",
      profilePhoto: profile.profilePhoto || "",
      website: profile.website || "",
      socialLinks: profile.socialLinks || {},
      authorType: profile.authorType,
      createdAt: profile.createdAt,
    };

    return NextResponse.json({
      author: publicAuthor,
      books: publishedBooks,
    });
  } catch (error) {
    console.error("GET /api/authors/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to load author profile" },
      { status: 500 }
    );
  }
}
