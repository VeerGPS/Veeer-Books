import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { BookSubmission } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { saveSecureFile } from "@/lib/secure-files";
import { logPublishingAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const submission = await BookSubmission.findById(params.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const readerFileObj = formData.get("readerFile") as File | null;
    const pdfFileObj = formData.get("pdfFile") as File | null;

    if (readerFileObj && readerFileObj.size > 0) {
      const savedReader = await saveSecureFile({
        file: readerFileObj,
        folder: "readers",
        prefix: `reader-${submission.title}`,
      });
      submission.formattedReaderFile = `/api/files/secure/${savedReader.storagePath}`;
    }

    if (pdfFileObj && pdfFileObj.size > 0) {
      const savedPdf = await saveSecureFile({
        file: pdfFileObj,
        folder: "books",
        prefix: `book-${submission.title}`,
      });
      submission.formattedPdfFile = `/api/files/secure/${savedPdf.storagePath}`;
    }

    await submission.save();

    await logPublishingAudit({
      submissionId: submission._id,
      submissionCode: submission.submissionId,
      actorRole: "admin",
      actorName: "VeeerBooks Admin",
      action: "UPLOAD_FORMATTED_READER_FILES",
      notes: `Admin uploaded formatted reader/PDF files for "${submission.title}".`,
    });

    return NextResponse.json({
      submission,
      message: "Formatted reader files uploaded successfully!",
    });
  } catch (error) {
    console.error("POST /api/admin/publishing/submissions/[id]/format error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload format files" },
      { status: 500 }
    );
  }
}
