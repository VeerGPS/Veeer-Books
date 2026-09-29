// Admin moderation: GET latest reviews, PATCH {id, status: "published" | "hidden"}
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import { Review } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { REVIEWS_TAG } from "@/lib/reviews";

export const dynamic = "force-dynamic";

function denied(req: NextRequest) {
  return !isAdminPasswordValid(req.headers.get("x-admin-password"));
}

export async function GET(req: NextRequest) {
  if (denied(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(300).lean();
  return NextResponse.json({ reviews });
}

export async function PATCH(req: NextRequest) {
  if (denied(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!id || !["published", "hidden"].includes(status)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await connectDB();
  await Review.updateOne({ _id: id }, { $set: { status } });
  revalidateTag(REVIEWS_TAG);
  return NextResponse.json({ ok: true });
}
