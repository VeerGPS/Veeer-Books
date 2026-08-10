import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { BundleModel } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const bundles = await BundleModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ bundles });
  } catch (error) {
    console.error("GET /api/admin/bundles error:", error);
    return NextResponse.json({ error: "Failed to list bundles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, description, bookIds, originalPrice, bundlePrice, badge, isActive } = body;

    if (!title || !Array.isArray(bookIds) || bookIds.length === 0 || !bundlePrice) {
      return NextResponse.json({ error: "Title, included books, and bundle price are required" }, { status: 400 });
    }

    const safeSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await connectDB();

    const existing = await BundleModel.findOne({ slug: safeSlug });
    if (existing) {
      return NextResponse.json({ error: "A bundle with this slug already exists" }, { status: 400 });
    }

    const bundle = await BundleModel.create({
      title,
      slug: safeSlug,
      description: description || "",
      bookIds: bookIds.map(Number),
      originalPrice: Number(originalPrice || 0),
      bundlePrice: Number(bundlePrice || 0),
      badge: badge || "🔥 LIMITED TIME OFFER",
      isActive: isActive !== false,
    });

    return NextResponse.json({ bundle, message: "Bundle offer created successfully" });
  } catch (error) {
    console.error("POST /api/admin/bundles error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create bundle offer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, slug, description, bookIds, originalPrice, bundlePrice, badge, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });
    }

    await connectDB();

    const findQuery = Types.ObjectId.isValid(String(id)) ? { _id: id } : { slug: String(id) };

    const updates: Record<string, any> = {};
    if (title) updates.title = title;
    if (slug) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    if (description !== undefined) updates.description = description;
    if (Array.isArray(bookIds)) updates.bookIds = bookIds.map(Number);
    if (originalPrice !== undefined) updates.originalPrice = Number(originalPrice);
    if (bundlePrice !== undefined) updates.bundlePrice = Number(bundlePrice);
    if (badge !== undefined) updates.badge = badge;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const bundle = await BundleModel.findOneAndUpdate(findQuery, updates, { new: true });
    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    return NextResponse.json({ bundle, message: "Bundle updated successfully" });
  } catch (error) {
    console.error("PUT /api/admin/bundles error:", error);
    return NextResponse.json({ error: "Failed to update bundle" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get("x-admin-password");
    if (!isAdminPasswordValid(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });
    }

    await connectDB();
    const findQuery = Types.ObjectId.isValid(String(id)) ? { _id: id } : { slug: String(id) };

    const bundle = await BundleModel.findOneAndDelete(findQuery);
    if (!bundle) {
      return NextResponse.json({ error: "Bundle offer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bundle offer deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/bundles error:", error);
    return NextResponse.json({ error: "Failed to delete bundle offer" }, { status: 500 });
  }
}
