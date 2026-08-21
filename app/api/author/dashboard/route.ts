import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  AuthorProfile,
  BookSubmission,
  BookModel,
  AuthorRevenueLedger,
  Notification,
} from "@/models";
import { requireAuth, getOptionalAuth } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getAuthorAgreementStatus } from "@/lib/publishing-agreement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = getOptionalAuth(req);
  if (!auth) {
    return NextResponse.json({ profile: null, hasProfile: false, authenticated: false }, { status: 200 });
  }

  try {
    await connectDB();

    const profile = await AuthorProfile.findOne({ userId: auth.userId }).lean();
    if (!profile) {
      return NextResponse.json({ profile: null, hasProfile: false, authenticated: true });
    }

    const settings = await getPlatformSettings();

    // Fetch submissions
    const submissions = await BookSubmission.find({ userId: auth.userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Submissions metrics
    const totalSubmissions = submissions.length;
    const draftCount = submissions.filter((s) => s.status === "DRAFT").length;
    const submittedCount = submissions.filter((s) => s.status === "SUBMITTED" || s.status === "RESUBMITTED").length;
    const underReviewCount = submissions.filter((s) => s.status === "UNDER_REVIEW").length;
    const changesRequestedCount = submissions.filter((s) => s.status === "CHANGES_REQUESTED").length;
    const approvedCount = submissions.filter((s) => s.status === "APPROVED" || s.status === "FORMATTING" || s.status === "QUALITY_CHECK" || s.status === "READY_TO_PUBLISH").length;
    const publishedSubmissionsCount = submissions.filter((s) => s.status === "PUBLISHED").length;

    // Fetch published live books
    const publishedBooks = await BookModel.find({
      $or: [{ authorId: profile._id }, { authorSlug: profile.slug }],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch sales ledger entries for this author
    const salesLedger = await AuthorRevenueLedger.find({ authorUserId: auth.userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalSalesCount = salesLedger.length;
    const totalGrossRevenue = salesLedger.reduce((sum, s) => sum + (s.grossAmount || 0), 0);
    const totalPlatformCommission = salesLedger.reduce((sum, s) => sum + (s.platformCommission || 0), 0);
    const totalAuthorEarnings = salesLedger.reduce((sum, s) => sum + (s.authorShare || 0), 0);
    const pendingSettlement = salesLedger
      .filter((s) => s.settlementStatus === "pending")
      .reduce((sum, s) => sum + (s.authorShare || 0), 0);
    const settledAmount = salesLedger
      .filter((s) => s.settlementStatus === "settled")
      .reduce((sum, s) => sum + (s.authorShare || 0), 0);

    // Fetch in-app notifications
    const notifications = await Notification.find({
      recipientUserId: auth.userId,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const agreementStatus = await getAuthorAgreementStatus(auth.userId);

    return NextResponse.json({
      hasProfile: true,
      profile,
      metrics: {
        totalBooks: publishedBooks.length,
        totalSubmissions,
        draftCount,
        submittedCount,
        underReviewCount,
        changesRequestedCount,
        approvedCount,
        publishedSubmissionsCount,
        totalSalesCount,
        totalGrossRevenue,
        totalPlatformCommission,
        totalAuthorEarnings,
        pendingSettlement,
        settledAmount,
        activeCommissionRate: settings.platformCommissionPercentage,
        isAgreementAccepted: agreementStatus.isAccepted,
        agreementVersion: agreementStatus.activeAgreement?.version,
      },
      agreementStatus: {
        isAccepted: agreementStatus.isAccepted,
        acceptedRecord: agreementStatus.acceptedRecord ? {
          agreementVersion: agreementStatus.acceptedRecord.agreementVersion,
          acceptedAt: agreementStatus.acceptedRecord.acceptedAt,
          acceptanceType: agreementStatus.acceptedRecord.acceptanceType,
        } : null,
        activeAgreement: agreementStatus.activeAgreement,
      },
      submissions,
      publishedBooks,
      salesLedger: salesLedger.slice(0, 50),
      notifications,
      platformSettings: {
        supportedCategories: settings.supportedCategories,
        supportedLanguages: settings.supportedLanguages,
        publishingAgreementText: agreementStatus.activeAgreement?.content || settings.publishingAgreementText,
        contentGuidelinesText: settings.contentGuidelinesText,
        authorTermsText: settings.authorTermsText,
      },
    });
  } catch (error) {
    console.error("GET /api/author/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load author dashboard" },
      { status: 500 }
    );
  }
}
