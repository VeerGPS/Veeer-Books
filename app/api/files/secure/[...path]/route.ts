import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongoose";
import { BookSubmission } from "@/models";
import { requireAuth } from "@/lib/auth";
import { isAdminPasswordValid } from "@/lib/admin";
import { UPLOAD_ROOT } from "@/lib/secure-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".epub": "application/epub+zip",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".rtf": "application/rtf",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const relativePath = params.path.join("/");
  const filePath = path.resolve(UPLOAD_ROOT, relativePath);
  const safeRoot = path.resolve(UPLOAD_ROOT) + path.sep;

  // Prevent directory traversal attacks
  if (!filePath.startsWith(safeRoot)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const folder = params.path[0];
  const isManuscript = folder === "manuscripts";

  // Public asset folders (covers, profiles) do not require manuscript protection
  if (isManuscript) {
    // Check admin authentication
    const adminHeader = req.headers.get("x-admin-password");
    const isAdmin = isAdminPasswordValid(adminHeader);

    if (!isAdmin) {
      // Check author ownership via JWT
      const auth = requireAuth(req);
      if (auth instanceof NextResponse) {
        return NextResponse.json(
          { error: "Unauthorized access to private manuscript" },
          { status: 401 }
        );
      }

      await connectDB();
      // Ensure the logged-in user owns the submission with this manuscript storagePath
      const submission = await BookSubmission.findOne({
        userId: auth.userId,
        "manuscriptFile.storagePath": relativePath,
      }).lean();

      if (!submission) {
        return NextResponse.json(
          { error: "Access denied. You are not authorized to view this manuscript." },
          { status: 403 }
        );
      }
    }
  }

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const isDownload = isManuscript || req.nextUrl.searchParams.get("download") === "1";
    const filename = path.basename(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": isDownload
          ? `attachment; filename="${filename}"`
          : "inline",
        "Cache-Control": isManuscript
          ? "private, no-cache, no-store, must-revalidate"
          : "public, max-age=86400",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
