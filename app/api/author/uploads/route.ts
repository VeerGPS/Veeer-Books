// Direct browser → Vercel Blob uploads for manuscripts and covers.
// GET  → { enabled } so the studio knows whether to use it.
// POST → issues a short-lived upload token (signed-in authors only).
import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "@/lib/auth";
import { blobEnabled } from "@/lib/secure-files";
import { COVER_MAX_MB, MANUSCRIPT_MAX_MB } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANUSCRIPT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "text/plain",
  "application/rtf",
  "text/rtf",
  "application/octet-stream",
];
const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function GET() {
  return NextResponse.json({ enabled: blobEnabled(), manuscriptMaxMb: MANUSCRIPT_MAX_MB, coverMaxMb: COVER_MAX_MB });
}

export async function POST(req: NextRequest) {
  if (!blobEnabled()) return NextResponse.json({ error: "Direct uploads are not configured" }, { status: 501 });
  const body = (await req.json()) as HandleUploadBody;

  // Token requests come from the author's browser and must be signed in.
  // (Completion callbacks come from Vercel and are verified by handleUpload itself.)
  if (body.type === "blob.generate-client-token") {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const isCover = pathname.startsWith("covers/");
        const isManuscript = pathname.startsWith("manuscripts/");
        if ((!isCover && !isManuscript) || pathname.includes("..")) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: isCover ? COVER_TYPES : MANUSCRIPT_TYPES,
          maximumSizeInBytes: (isCover ? COVER_MAX_MB : MANUSCRIPT_MAX_MB) * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
}
