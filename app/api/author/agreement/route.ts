import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AuthorProfile, AgreementAcceptance } from "@/models";
import { requireAuth, getOptionalAuth } from "@/lib/auth";
import {
  getActivePublishingAgreement,
  getAuthorAgreementStatus,
  recordAgreementAcceptance,
  DEFAULT_AGREEMENT_VERSION,
} from "@/lib/publishing-agreement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = getOptionalAuth(req);
  if (!auth) {
    return NextResponse.json(
      { hasAccepted: false, acceptedRecord: null, activeAgreement: null, authenticated: false },
      { status: 200 }
    );
  }

  try {
    const status = await getAuthorAgreementStatus(auth.userId);
    return NextResponse.json({ ...status, authenticated: true });
  } catch (error) {
    console.error("GET /api/author/agreement error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreement status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const author = await AuthorProfile.findOne({ userId: auth.userId });
    if (!author) {
      return NextResponse.json(
        { error: "Please complete your Author Profile before accepting the agreement." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const activeAgreement = await getActivePublishingAgreement();
    const versionToAccept = body.agreementVersion || activeAgreement.version || DEFAULT_AGREEMENT_VERSION;

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    const acceptance = await recordAgreementAcceptance({
      userId: auth.userId,
      authorId: author._id,
      agreementVersion: versionToAccept,
      agreementTitle: activeAgreement.title,
      submissionId: body.submissionId,
      ipAddress,
      userAgent,
      acceptanceType: body.acceptanceType || "dashboard_standalone",
      rightsConfirmed: body.rightsConfirmed !== false,
      accurateInfoConfirmed: body.accurateInfoConfirmed !== false,
    });

    return NextResponse.json({
      ok: true,
      acceptance: {
        agreementVersion: acceptance.agreementVersion,
        acceptedAt: acceptance.acceptedAt,
        acceptanceType: acceptance.acceptanceType,
      },
      message: "Publishing agreement accepted successfully.",
    });
  } catch (error) {
    console.error("POST /api/author/agreement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record agreement acceptance" },
      { status: 500 }
    );
  }
}
