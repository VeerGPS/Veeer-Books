import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  PublishingAgreementVersion,
  AgreementAcceptance,
} from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { version: string } }
) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const versionStr = decodeURIComponent(params.version);
    const agreement = await PublishingAgreementVersion.findOne({
      version: versionStr,
    }).lean();

    if (!agreement) {
      return NextResponse.json({ error: "Agreement version not found" }, { status: 404 });
    }

    const acceptances = await AgreementAcceptance.find({
      agreementVersion: versionStr,
    })
      .populate("authorId", "penName fullName email slug")
      .sort({ acceptedAt: -1 })
      .lean();

    return NextResponse.json({
      agreement,
      acceptances,
      totalAcceptances: acceptances.length,
    });
  } catch (error) {
    console.error("GET /api/admin/publishing/agreements/[version] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreement version" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { version: string } }
) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const versionStr = decodeURIComponent(params.version);
    const body = await req.json();
    const { action } = body;

    const agreement = await PublishingAgreementVersion.findOne({
      version: versionStr,
    });

    if (!agreement) {
      return NextResponse.json({ error: "Agreement version not found" }, { status: 404 });
    }

    if (action === "SET_ACTIVE") {
      // Deactivate all other versions
      await PublishingAgreementVersion.updateMany({}, { isActive: false });
      agreement.isActive = true;
      await agreement.save();

      return NextResponse.json({
        agreement,
        message: `Version ${versionStr} is now set as the active platform publishing agreement.`,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/admin/publishing/agreements/[version] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agreement" },
      { status: 500 }
    );
  }
}
