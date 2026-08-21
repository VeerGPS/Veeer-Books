import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  BookSubmission,
  BookSubmissionRevision,
  AuthorProfile,
} from "@/models";
import { requireAuth } from "@/lib/auth";
import {
  saveSecureFile,
  isAllowedManuscript,
  isAllowedCover,
  calculateSubmissionCompleteness,
} from "@/lib/secure-files";
import {
  notifyAdminBookDetailsCompleted,
  notifyAdminBookResubmitted,
  notifyAdminBookSubmitted,
} from "@/lib/email-service";
import { createInAppNotification } from "@/lib/notifications";
import { logPublishingAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const submission = await BookSubmission.findOne({
      _id: params.id,
      userId: auth.userId,
    })
      .populate("revisions")
      .lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const completeness = calculateSubmissionCompleteness({
      title: submission.title,
      description: submission.description,
      category: submission.category,
      language: submission.language,
      desiredPrice: submission.desiredPrice,
      manuscriptFile: submission.manuscriptFile,
      coverFile: submission.coverFile,
      rightsConfirmed: submission.rightsConfirmed,
      termsAccepted: submission.termsAccepted,
    });

    return NextResponse.json({ submission, completeness });
  } catch (error) {
    console.error("GET /api/author/submissions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const submission = await BookSubmission.findOne({
      _id: params.id,
      userId: auth.userId,
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Authors can only edit submissions in DRAFT or CHANGES_REQUESTED states
    if (!["DRAFT", "CHANGES_REQUESTED"].includes(submission.status)) {
      return NextResponse.json(
        {
          error: `Cannot edit submission while in "${submission.status}" status. Only submissions in DRAFT or CHANGES_REQUESTED can be modified.`,
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const title = String(formData.get("title") || submission.title).trim();
    const subtitle = String(formData.get("subtitle") !== null ? formData.get("subtitle") : submission.subtitle).trim();
    const penName = String(formData.get("penName") || submission.penName).trim();
    const description = String(formData.get("description") !== null ? formData.get("description") : submission.description).trim();
    const category = String(formData.get("category") || submission.category).trim();
    const subcategory = String(formData.get("subcategory") !== null ? formData.get("subcategory") : submission.subcategory).trim();
    const language = String(formData.get("language") || submission.language).trim();
    const intendedAudience = String(formData.get("intendedAudience") !== null ? formData.get("intendedAudience") : submission.intendedAudience).trim();
    const publicationDetails = String(formData.get("publicationDetails") !== null ? formData.get("publicationDetails") : submission.publicationDetails).trim();
    const authorNotes = String(formData.get("authorNotes") || "").trim();

    const rawTags = formData.get("tags");
    const tags = rawTags !== null
      ? String(rawTags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : submission.tags;

    const desiredPrice = formData.get("desiredPrice") !== null
      ? Number(formData.get("desiredPrice"))
      : submission.desiredPrice;
    const actualPrice = formData.get("actualPrice") !== null
      ? Number(formData.get("actualPrice"))
      : submission.actualPrice;

    const rightsConfirmed = formData.get("rightsConfirmed") !== null
      ? formData.get("rightsConfirmed") === "true"
      : submission.rightsConfirmed;

    const termsAccepted = formData.get("termsAccepted") !== null
      ? formData.get("termsAccepted") === "true"
      : submission.termsAccepted;

    const action = String(formData.get("action") || "draft"); // "draft" | "submit" | "resubmit"

    // Process new file uploads if supplied
    const manuscriptFileObj = formData.get("manuscriptFile") as File | null;
    const coverFileObj = formData.get("coverFile") as File | null;

    let manuscriptData = submission.manuscriptFile;
    if (manuscriptFileObj && manuscriptFileObj.size > 0) {
      if (!isAllowedManuscript(manuscriptFileObj.name)) {
        return NextResponse.json(
          { error: "Invalid manuscript format. Allowed: .pdf, .docx, .doc, .epub, .txt, .rtf" },
          { status: 400 }
        );
      }
      const savedMs = await saveSecureFile({
        file: manuscriptFileObj,
        folder: "manuscripts",
        prefix: `ms-${title}`,
      });
      manuscriptData = {
        ...savedMs,
        uploadedAt: new Date(),
      };
    }

    let coverData = submission.coverFile;
    if (coverFileObj && coverFileObj.size > 0) {
      if (!isAllowedCover(coverFileObj.name)) {
        return NextResponse.json(
          { error: "Invalid cover image format. Allowed: .jpg, .png, .webp" },
          { status: 400 }
        );
      }
      const savedCov = await saveSecureFile({
        file: coverFileObj,
        folder: "covers",
        prefix: `cov-${title}`,
      });
      coverData = {
        ...savedCov,
        uploadedAt: new Date(),
      };
    }

    const completeness = calculateSubmissionCompleteness({
      title,
      description,
      category,
      language,
      desiredPrice,
      manuscriptFile: manuscriptData,
      coverFile: coverData,
      rightsConfirmed,
      termsAccepted,
    });

    const isSubmittingOrResubmitting = action === "submit" || action === "resubmit";

    if (isSubmittingOrResubmitting && !completeness.isComplete) {
      return NextResponse.json(
        {
          error: `Submission is incomplete (${completeness.percentage}%). Missing required items: ${completeness.missingFields.join(", ")}.`,
          completeness,
        },
        { status: 400 }
      );
    }

    const prevStatus = submission.status;
    const previousFeedback = submission.adminFeedback;
    const now = new Date();

    submission.title = title;
    submission.subtitle = subtitle;
    submission.penName = penName;
    submission.description = description;
    submission.category = category;
    submission.subcategory = subcategory;
    submission.language = language;
    submission.intendedAudience = intendedAudience;
    submission.tags = tags;
    submission.publicationDetails = publicationDetails;
    submission.desiredPrice = desiredPrice;
    submission.actualPrice = actualPrice;
    submission.rightsConfirmed = rightsConfirmed;
    if (rightsConfirmed && !submission.rightsConfirmedAt) {
      submission.rightsConfirmedAt = now;
    }
    submission.termsAccepted = termsAccepted;
    if (termsAccepted && !submission.termsAcceptedAt) {
      submission.termsAcceptedAt = now;
    }

    if (manuscriptData) submission.manuscriptFile = manuscriptData;
    if (coverData) submission.coverFile = coverData;

    const hadDetailsCompleted = submission.isDetailsCompleted;
    submission.completenessPercentage = completeness.percentage;
    submission.isDetailsCompleted = completeness.isComplete;
    if (completeness.isComplete && !hadDetailsCompleted) {
      submission.detailsCompletedAt = now;
    }

    let newStatus = submission.status;

    if (action === "submit" && prevStatus === "DRAFT") {
      newStatus = "SUBMITTED";
      submission.status = "SUBMITTED";
      submission.submittedAt = now;
    } else if (action === "resubmit" && prevStatus === "CHANGES_REQUESTED") {
      newStatus = "RESUBMITTED";
      submission.status = "RESUBMITTED";
      const nextRevNumber = (submission.currentRevision || 1) + 1;
      submission.currentRevision = nextRevNumber;

      // Create new revision record without destroying old revisions
      const newRev = await BookSubmissionRevision.create({
        submissionId: submission._id,
        revisionNumber: nextRevNumber,
        title,
        subtitle,
        description,
        category,
        desiredPrice,
        actualPrice,
        manuscriptFile: manuscriptData,
        coverFile: coverData,
        authorNotes,
        adminFeedbackAtTime: previousFeedback,
        statusAtRevision: "RESUBMITTED",
        submittedAt: now,
      });

      submission.revisions.push(newRev._id);
    }

    await submission.save();

    // Log audit trail
    if (isSubmittingOrResubmitting || newStatus !== prevStatus) {
      await logPublishingAudit({
        submissionId: submission._id,
        submissionCode: submission.submissionId,
        actorUserId: auth.userId,
        actorRole: "author",
        actorName: penName,
        action: action === "resubmit" ? "BOOK_RESUBMITTED" : "SUBMISSION_UPDATED",
        previousStatus: prevStatus,
        newStatus,
        notes: action === "resubmit"
          ? `Author resubmitted revision #${submission.currentRevision}. Notes: ${authorNotes || "None"}`
          : `Author updated submission details.`,
      });

      await createInAppNotification({
        recipientUserId: auth.userId,
        recipientRole: "author",
        type: action === "resubmit" ? "BOOK_RESUBMITTED" : "SUBMISSION_UPDATED",
        title: action === "resubmit" ? "Book Resubmitted 🔄" : "Submission Updated",
        message: action === "resubmit"
          ? `Your revision #${submission.currentRevision} for "${submission.title}" has been resubmitted to the editorial team.`
          : `Changes to "${submission.title}" have been saved.`,
        link: `/author/submissions/${submission._id.toString()}`,
      });
    }

    // Trigger emails
    if (completeness.isComplete && !hadDetailsCompleted) {
      notifyAdminBookDetailsCompleted(submission.toObject()).catch((err) =>
        console.error("Admin details completed email error:", err)
      );
    }

    if (action === "submit" && prevStatus === "DRAFT") {
      notifyAdminBookSubmitted(submission.toObject()).catch((err) =>
        console.error("Admin book submitted email error:", err)
      );
    }

    if (action === "resubmit" && prevStatus === "CHANGES_REQUESTED") {
      notifyAdminBookResubmitted(submission.toObject(), previousFeedback).catch((err) =>
        console.error("Admin book resubmitted email error:", err)
      );
    }

    return NextResponse.json({
      submission,
      completeness,
      message: action === "resubmit"
        ? `Revision #${submission.currentRevision} resubmitted for editorial review!`
        : action === "submit"
        ? "Book submitted for review successfully!"
        : "Draft changes saved successfully!",
    });
  } catch (error) {
    console.error("PUT /api/author/submissions/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update submission" },
      { status: 500 }
    );
  }
}
