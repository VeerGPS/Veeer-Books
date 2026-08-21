import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  BookSubmission,
  AuthorProfile,
  BookModel,
  User,
} from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import {
  notifyBookApproved,
  notifyAdminBookReadyToPublish,
  notifyBookPublished,
} from "@/lib/email-service";
import { createInAppNotification } from "@/lib/notifications";
import { logPublishingAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

    const author = await AuthorProfile.findById(submission.authorId);
    const body = await req.json();
    const { action, feedback, internalNotes } = body;

    const prevStatus = submission.status;
    const now = new Date();

    if (internalNotes !== undefined) {
      submission.internalNotes = internalNotes;
    }

    switch (action) {
      case "START_REVIEW": {
        submission.status = "UNDER_REVIEW";
        submission.reviewedAt = now;
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "START_EDITORIAL_REVIEW",
          previousStatus: prevStatus,
          newStatus: "UNDER_REVIEW",
          notes: "Editorial team started review of manuscript and metadata.",
        });

        await createInAppNotification({
          recipientUserId: submission.userId,
          recipientRole: "author",
          type: "BOOK_UNDER_REVIEW",
          title: "Manuscript Under Review 🧐",
          message: `Our editorial team has started reviewing your submission "${submission.title}".`,
          link: `/author/submissions/${submission._id.toString()}`,
        });
        break;
      }

      case "REQUEST_CHANGES": {
        if (!feedback || !feedback.trim()) {
          return NextResponse.json(
            { error: "Please provide detailed feedback explaining what changes are needed." },
            { status: 400 }
          );
        }

        submission.status = "CHANGES_REQUESTED";
        submission.adminFeedback = feedback.trim();
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "REQUEST_SUBMISSION_CHANGES",
          previousStatus: prevStatus,
          newStatus: "CHANGES_REQUESTED",
          notes: `Admin requested changes: "${feedback.trim()}"`,
        });

        await createInAppNotification({
          recipientUserId: submission.userId,
          recipientRole: "author",
          type: "CHANGES_REQUESTED",
          title: "Changes Requested on Your Submission ⚠️",
          message: `Editorial feedback: ${feedback.trim()}`,
          link: `/author/submissions/${submission._id.toString()}/edit`,
        });
        break;
      }

      case "APPROVE": {
        submission.status = "APPROVED";
        submission.approvedAt = now;
        submission.adminFeedback = "";
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "APPROVE_SUBMISSION",
          previousStatus: prevStatus,
          newStatus: "APPROVED",
          notes: "Submission approved by editorial team. Ready for formatting.",
        });

        await createInAppNotification({
          recipientUserId: submission.userId,
          recipientRole: "author",
          type: "BOOK_APPROVED",
          title: "Book Approved! 🎉",
          message: `Your book "${submission.title}" has been approved! Our team is preparing the interactive web reader.`,
          link: `/author/submissions/${submission._id.toString()}`,
        });

        // Trigger emails
        notifyBookApproved(submission.toObject(), author?.email).catch((err) =>
          console.error("Book approved email error:", err)
        );
        break;
      }

      case "REJECT": {
        submission.status = "REJECTED";
        submission.adminFeedback = feedback || "Submission does not meet current publishing guidelines.";
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "REJECT_SUBMISSION",
          previousStatus: prevStatus,
          newStatus: "REJECTED",
          notes: `Submission rejected. Reason: ${submission.adminFeedback}`,
        });

        await createInAppNotification({
          recipientUserId: submission.userId,
          recipientRole: "author",
          type: "BOOK_REJECTED",
          title: "Submission Not Accepted",
          message: `Your submission "${submission.title}" was not accepted. Reason: ${submission.adminFeedback}`,
          link: `/author/submissions/${submission._id.toString()}`,
        });
        break;
      }

      case "MOVE_TO_FORMATTING": {
        submission.status = "FORMATTING";
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "START_MANUSCRIPT_FORMATTING",
          previousStatus: prevStatus,
          newStatus: "FORMATTING",
          notes: "Manuscript conversion into VeeerBooks reader format in progress.",
        });
        break;
      }

      case "COMPLETE_QUALITY_CHECK": {
        submission.status = "QUALITY_CHECK";
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "COMPLETE_QUALITY_CHECK",
          previousStatus: prevStatus,
          newStatus: "QUALITY_CHECK",
          notes: "Manual formatting completed, reader quality check verified.",
        });
        break;
      }

      case "MARK_READY": {
        submission.status = "READY_TO_PUBLISH";
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "MARK_READY_TO_PUBLISH",
          previousStatus: prevStatus,
          newStatus: "READY_TO_PUBLISH",
          notes: "Book verified and ready for live storefront publishing.",
        });

        notifyAdminBookReadyToPublish(submission.toObject()).catch((err) =>
          console.error("Book ready email error:", err)
        );
        break;
      }

      case "PUBLISH": {
        // Find next numeric ID for book catalog
        const latestBook = await BookModel.findOne({}).sort({ id: -1 }).lean();
        const nextId = (latestBook?.id ?? 6) + 1;

        // Generate URL-friendly unique slug for product page
        const baseSlug = generateSlug(submission.title) || `book-${nextId}`;
        let candidateSlug = baseSlug;
        let counter = 1;
        while (await BookModel.findOne({ slug: candidateSlug })) {
          candidateSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        const finalSlug = candidateSlug;

        const coverPath = submission.coverFile?.storagePath
          ? `/api/files/secure/${submission.coverFile.storagePath}`
          : "/images/default-book.svg";

        const readerPath =
          submission.formattedReaderFile || `/readers/${finalSlug}.html`;
        const pdfPath =
          submission.formattedPdfFile || "/books/default-book.pdf";

        const sellingPrice = Number(submission.desiredPrice || 149);
        const actualPrice = Number(submission.actualPrice || sellingPrice);

        // Create or connect Book in main BookModel catalogue
        const publishedBook = await BookModel.create({
          id: nextId,
          title: submission.title,
          author: submission.penName || author?.penName || "External Author",
          slug: finalSlug,
          actualPrice,
          sellingPrice,
          price: sellingPrice,
          description: submission.description || submission.title,
          htmlContent: `<p>${submission.description}</p>`,
          color: "#2c3e50",
          accent: "#1a252f",
          genre: submission.category || "General",
          pages: 100,
          cover: coverPath,
          reader: readerPath,
          pdf: pdfPath,
          highlights: submission.tags || [],
          isActive: true,
          authorId: submission.authorId,
          authorSlug: author?.slug,
          authorBio: author?.biography,
          submissionId: submission._id,
          publisherType: "external_author",
        });

        // Update submission status
        submission.status = "PUBLISHED";
        submission.publishedBookId = nextId;
        submission.publishedBookSlug = finalSlug;
        submission.publishedAt = now;
        await submission.save();

        // Log audit
        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          bookId: nextId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "PUBLISH_BOOK_TO_STORE",
          previousStatus: prevStatus,
          newStatus: "PUBLISHED",
          notes: `Book published to storefront as ID #${nextId} (slug: /product/${finalSlug}).`,
        });

        // Notify author
        await createInAppNotification({
          recipientUserId: submission.userId,
          recipientRole: "author",
          type: "BOOK_PUBLISHED",
          title: "Your Book is Live! 🚀",
          message: `Congratulations! "${submission.title}" is now officially published on Veeer Sukhadiya Books.`,
          link: `/product/${finalSlug}`,
        });

        // Trigger emails
        notifyBookPublished({
          submission: submission.toObject(),
          productSlug: finalSlug,
          bookPrice: sellingPrice,
          authorEmail: author?.email,
        }).catch((err) => console.error("Book published email error:", err));

        return NextResponse.json({
          submission,
          publishedBook,
          message: `Book "${submission.title}" has been successfully published to the storefront!`,
        });
      }

      case "WITHDRAW": {
        submission.status = "WITHDRAWN";
        await submission.save();

        await logPublishingAudit({
          submissionId: submission._id,
          submissionCode: submission.submissionId,
          actorRole: "admin",
          actorName: "VeeerBooks Admin",
          action: "WITHDRAW_SUBMISSION",
          previousStatus: prevStatus,
          newStatus: "WITHDRAWN",
          notes: "Submission withdrawn.",
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      submission,
      message: `Action "${action}" executed successfully.`,
    });
  } catch (error) {
    console.error("POST /api/admin/publishing/submissions/[id]/action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute action" },
      { status: 500 }
    );
  }
}
