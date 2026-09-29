import { NextRequest, NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Small fixed delay slows down password guessing.
  await new Promise((r) => setTimeout(r, 400));
  if (!isAdminPasswordValid(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
