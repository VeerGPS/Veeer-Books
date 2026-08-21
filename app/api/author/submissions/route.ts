import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  AuthorProfile,
  BookSubmission,
  BookSubmissionRevision,
  User,
} from "@/models";
import { requireAuth, getOptionalAuth } from "@/lib/auth";
import {
  saveSecureFile,
  isAllowedManuscript,
  isAllowedCover,
  calculateSubmissionCompleteness,
} from "@/lib/secure-files";
import {
  notifyAdminBookDetailsCompleted,
  notifyAdminBookSubmitted,
} from "@/lib/email-service";
import { createInAppNotification } from "@/lib/notifications";
import { logPublishingAudit } from "@/lib/audit";
import {
  getActivePublishingAgreement,
  recordAgreementAcceptance,
  DEFAULT_AGREEMENT_VERSION,
} from "@/lib/publishing-agreement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = getOptionalAuth(req);
  if (!auth) {
    return NextResponse.json({ submissions: [], authenticated: false }, { status: 200 });
  }

  try {
    await connectDB();
    const submissions = await BookSubmission.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ submissions, authenticated: true });
  } catch (error) {
    console.error("GET /api/author/submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();

    const author = await AuthorProfile.findOne({ userId: auth.userId }).lean();
    if (!author) {
      return NextResponse.json(
        { error: "Please complete your Author Profile before submitting a book." },
        { status: 400 }
      );
    }

    const user = await User.findById(auth.userId).lean();
    const formData = await req.formData();

    const title = String(formData.get("title") || "").trim();
    const subtitle = String(formData.get("subtitle") || "").trim();
    const penName = String(formData.get("penName") || author.penName || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "General").trim();
    const subcategory = String(formData.get("subcategory") || "").trim();
    const language = String(formData.get("language") || "English").trim();
    const intendedAudience = String(formData.get("intendedAudience") || "").trim();
    const publicationDetails = String(formData.get("publicationDetails") || "").trim();
    const rawTags = formData.get("tags");
    const tags = rawTags
      ? String(rawTags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const desiredPrice = Number(formData.get("desiredPrice") || 0);
    const actualPrice = Number(formData.get("actualPrice") || desiredPrice);

    const rightsConfirmed = formData.get("rightsConfirmed") === "true";
    const termsAccepted = formData.get("termsAccepted") === "true";
    const accurateInfoConfirmed = formData.get("accurateInfoConfirmed") === "true";
    const rawAgreementVersion = formData.get("agreementVersion");
    const activeAgreement = await getActivePublishingAgreement();
    const agreementVersion = String(rawAgreementVersion || activeAgreement.version || DEFAULT_AGREEMENT_VERSION).trim();
    const action = String(formData.get("action") || "draft"); // "draft" | "submit"

    if (!title) {
      return NextResponse.json({ error: "Book title is required." }, { status: 400 });
    }

    // Handle manuscript and cover files
    const manuscriptFileObj = formData.get("manuscriptFile") as File | null;
    const coverFileObj = formData.get("coverFile") as File | null;

    let manuscriptData: any = undefined;
    if (manuscriptFileObj && manuscriptFileObj.size > 0) {
      if (!isAllowedManuscript(manuscriptFileObj.name)) {
        return NextResponse.json(
          {
            error:
              "Invalid manuscript format. Allowed formats: PDF (.pdf), Word (.docx, .doc), EPUB (.epub), Plain Text (.txt, .rtf).",
          },
          { status: 400 }
        );
      }
      manuscriptData = await saveSecureFile({
        file: manuscriptFileObj,
        folder: "manuscripts",
        prefix: `ms-${title}`,
      });
      manuscriptData.uploadedAt = new Date();
    }

    let coverData: any = undefined;
    if (coverFileObj && coverFileObj.size > 0) {
      if (!isAllowedCover(coverFileObj.name)) {
        return NextResponse.json(
          { error: "Invalid cover image format. Allowed formats: JPG, PNG, WEBP." },
          { status: 400 }
        );
      }
      coverData = await saveSecureFile({
        file: coverFileObj,
        folder: "covers",
        prefix: `cov-${title}`,
      });
      coverData.uploadedAt = new Date();
    }

    // Generate unique human-readable submission ID (e.g. VSB-SUB-1001)
    const count = await BookSubmission.countDocuments();
    const submissionId = `VSB-SUB-${1000 + count + 1}`;

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

    const isSubmitting = action === "submit";

    if (isSubmitting && !completeness.isComplete) {
      return NextResponse.json(
        {
          error: `Submission is incomplete (${completeness.percentage}%). Missing required items: ${completeness.missingFields.join(", ")}.`,
          completeness,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const initialStatus = isSubmitting ? "SUBMITTED" : "DRAFT";

    const submission = await BookSubmission.create({
      submissionId,
      authorId: author._id,
      userId: auth.userId,
      title,
      subtitle,
      penName,
      description,
      category,
      subcategory,
      language,
      intendedAudience,
      tags,
      publicationDetails,
      manuscriptFile: manuscriptData,
      coverFile: coverData,
      currency: "INR",
      desiredPrice,
      actualPrice,
      rightsConfirmed,
      rightsConfirmedAt: rightsConfirmed ? now : undefined,
      termsAccepted,
      termsAcceptedAt: termsAccepted ? now : undefined,
      agreementVersion,
      status: initialStatus,
      completenessPercentage: completeness.percentage,
      isDetailsCompleted: completeness.isComplete,
      detailsCompletedAt: completeness.isComplete ? now : undefined,
      currentRevision: 1,
      revisions: [],
      submittedAt: isSubmitting ? now : undefined,
    });

    // If officially submitting, record immutable agreement acceptance audit record
    if (isSubmitting) {
      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "";
      const userAgent = req.headers.get("user-agent") || "";

      await recordAgreementAcceptance({
        userId: auth.userId,
        authorId: author._id,
        agreementVersion,
        submissionId: submission._id,
        ipAddress,
        userAgent,
        acceptanceType: "submission_workflow",
        rightsConfirmed,
        accurateInfoConfirmed,
      }).catch((accErr) => console.error("Agreement acceptance record error:", accErr));
    }

    // Create Revision 1 record
    const revision = await BookSubmissionRevision.create({
      submissionId: submission._id,
      revisionNumber: 1,
      title,
      subtitle,
      description,
      category,
      desiredPrice,
      actualPrice,
      manuscriptFile: manuscriptData,
      coverFile: coverData,
      statusAtRevision: initialStatus,
      submittedAt: now,
    });

    submission.revisions.push(revision._id);
    await submission.save();

    // Log audit trail
    await logPublishingAudit({
      submissionId: submission._id,
      submissionCode: submission.submissionId,
      actorUserId: auth.userId,
      actorRole: "author",
      actorName: penName,
      action: isSubmitting ? "SUBMISSION_SUBMITTED" : "SUBMISSION_DRAFT_CREATED",
      previousStatus: "NONE",
      newStatus: initialStatus,
      notes: isSubmitting
        ? `Submission officially submitted for publication review (Revision #1).`
        : `Submission draft created (${completeness.percentage}% complete).`,
    });

    // In-app notification for author
    await createInAppNotification({
      recipientUserId: auth.userId,
      recipientRole: "author",
      type: isSubmitting ? "SUBMISSION_SUBMITTED" : "SUBMISSION_DRAFT_CREATED",
      title: isSubmitting ? "Book Submitted for Review 📖" : "Draft Saved",
      message: isSubmitting
        ? `Your book "${submission.title}" has been submitted for editorial review. Submission Code: ${submission.submissionId}.`
        : `Your submission draft for "${submission.title}" is saved (${completeness.percentage}% complete).`,
      link: `/author/submissions/${submission._id.toString()}`,
    });

    // Milestone Event B: Book Details 100% Complete
    if (completeness.isComplete) {
      notifyAdminBookDetailsCompleted(submission.toObject()).catch((err) =>
        console.error("Admin book details completed email error:", err)
      );
    }

    // Milestone Event C: Book Submitted for Publication
    if (isSubmitting) {
      notifyAdminBookSubmitted(submission.toObject()).catch((err) =>
        console.error("Admin book submitted email error:", err)
      );
    }

    return NextResponse.json({
      submission,
      completeness,
      message: isSubmitting
        ? "Your book has been submitted for review successfully!"
        : "Draft saved successfully!",
    });
  } catch (error) {
    console.error("POST /api/author/submissions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save submission" },
      { status: 500 }
    );
  }
}
