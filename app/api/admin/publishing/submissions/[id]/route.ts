import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { BookSubmission, PublishingAuditLog, AuthorProfile } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const submission = await BookSubmission.findById(params.id)
      .populate("authorId")
      .populate("revisions")
      .lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const auditLogs = await PublishingAuditLog.find({
      $or: [{ submissionId: params.id }, { submissionCode: submission.submissionId }],
    })
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({ submission, auditLogs });
  } catch (error) {
    console.error("GET /api/admin/publishing/submissions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission details" },
      { status: 500 }
    );
  }
}
