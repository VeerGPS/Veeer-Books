import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { BookSubmission, AuthorProfile } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");

    const query: Record<string, any> = {};

    if (status && status !== "ALL") {
      if (status === "NEW") {
        query.status = { $in: ["SUBMITTED", "RESUBMITTED"] };
      } else if (status === "FORMATTING_QUEUE") {
        query.status = { $in: ["APPROVED", "FORMATTING", "QUALITY_CHECK", "READY_TO_PUBLISH"] };
      } else {
        query.status = status;
      }
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { penName: regex },
        { submissionId: regex },
        { category: regex },
      ];
    }

    const submissions = await BookSubmission.find(query)
      .populate("authorId")
      .sort({ updatedAt: -1 })
      .lean();

    // Summary counts for dashboard tabs
    const allCount = await BookSubmission.countDocuments();
    const newCount = await BookSubmission.countDocuments({ status: { $in: ["SUBMITTED", "RESUBMITTED"] } });
    const underReviewCount = await BookSubmission.countDocuments({ status: "UNDER_REVIEW" });
    const changesRequestedCount = await BookSubmission.countDocuments({ status: "CHANGES_REQUESTED" });
    const approvedCount = await BookSubmission.countDocuments({ status: "APPROVED" });
    const formattingCount = await BookSubmission.countDocuments({ status: "FORMATTING" });
    const qualityCheckCount = await BookSubmission.countDocuments({ status: "QUALITY_CHECK" });
    const readyToPublishCount = await BookSubmission.countDocuments({ status: "READY_TO_PUBLISH" });
    const publishedCount = await BookSubmission.countDocuments({ status: "PUBLISHED" });
    const rejectedCount = await BookSubmission.countDocuments({ status: "REJECTED" });

    return NextResponse.json({
      submissions,
      counts: {
        all: allCount,
        new: newCount,
        underReview: underReviewCount,
        changesRequested: changesRequestedCount,
        approved: approvedCount,
        formatting: formattingCount,
        qualityCheck: qualityCheckCount,
        readyToPublish: readyToPublishCount,
        published: publishedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/publishing/submissions error:", error);
    return NextResponse.json(
      { error: "Failed to list submissions" },
      { status: 500 }
    );
  }
}
