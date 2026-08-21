import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  PublishingAgreementVersion,
  AgreementAcceptance,
} from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import {
  getActivePublishingAgreement,
  DEFAULT_AGREEMENT_VERSION,
  DEFAULT_28_SECTION_AGREEMENT,
  DEFAULT_AGREEMENT_TITLE,
} from "@/lib/publishing-agreement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    // Ensure at least default version exists
    await getActivePublishingAgreement();

    const versions = await PublishingAgreementVersion.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Compute acceptance count per version
    const versionStats = await Promise.all(
      versions.map(async (v) => {
        const count = await AgreementAcceptance.countDocuments({
          agreementVersion: v.version,
        });
        return {
          ...v,
          acceptanceCount: count,
        };
      })
    );

    const activeVersion = versionStats.find((v) => v.isActive);

    return NextResponse.json({
      versions: versionStats,
      activeVersion,
    });
  } catch (error) {
    console.error("GET /api/admin/publishing/agreements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreement versions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const {
      version,
      title = DEFAULT_AGREEMENT_TITLE,
      content = DEFAULT_28_SECTION_AGREEMENT,
      summary = "",
      makeActive = false,
    } = body;

    const trimmedVersion = String(version || "").trim().toUpperCase();
    if (!trimmedVersion) {
      return NextResponse.json(
        { error: "Version identifier is required (e.g. VSB-DPA-1.1)" },
        { status: 400 }
      );
    }

    const existing = await PublishingAgreementVersion.findOne({ version: trimmedVersion });
    if (existing) {
      return NextResponse.json(
        { error: `Agreement version "${trimmedVersion}" already exists. Versions are immutable.` },
        { status: 400 }
      );
    }

    if (makeActive) {
      // Deactivate all previous versions
      await PublishingAgreementVersion.updateMany({}, { isActive: false });
    }

    const created = await PublishingAgreementVersion.create({
      version: trimmedVersion,
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim(),
      effectiveDate: new Date(),
      isActive: Boolean(makeActive),
      createdBy: "admin",
    });

    return NextResponse.json({
      version: created,
      message: `Agreement version ${trimmedVersion} created successfully!`,
    });
  } catch (error) {
    console.error("POST /api/admin/publishing/agreements error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create agreement version" },
      { status: 500 }
    );
  }
}
