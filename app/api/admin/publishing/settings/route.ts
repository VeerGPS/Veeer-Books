import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { PlatformSettings } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/admin/publishing/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform settings" },
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
      platformCommissionPercentage,
      supportedCategories,
      supportedLanguages,
      minBookPrice,
      maxBookPrice,
      adminNotificationEmail,
      publishingAgreementText,
      contentGuidelinesText,
      authorTermsText,
    } = body;

    let settings = await PlatformSettings.findOne({ key: "main_config" });
    if (!settings) {
      settings = new PlatformSettings({ key: "main_config" });
    }

    if (platformCommissionPercentage !== undefined) {
      settings.platformCommissionPercentage = Number(platformCommissionPercentage);
    }
    if (Array.isArray(supportedCategories)) {
      settings.supportedCategories = supportedCategories;
    }
    if (Array.isArray(supportedLanguages)) {
      settings.supportedLanguages = supportedLanguages;
    }
    if (minBookPrice !== undefined) {
      settings.minBookPrice = Number(minBookPrice);
    }
    if (maxBookPrice !== undefined) {
      settings.maxBookPrice = Number(maxBookPrice);
    }
    if (adminNotificationEmail !== undefined) {
      settings.adminNotificationEmail = adminNotificationEmail.trim();
    }
    if (publishingAgreementText !== undefined) {
      settings.publishingAgreementText = publishingAgreementText;
    }
    if (contentGuidelinesText !== undefined) {
      settings.contentGuidelinesText = contentGuidelinesText;
    }
    if (authorTermsText !== undefined) {
      settings.authorTermsText = authorTermsText;
    }

    await settings.save();

    return NextResponse.json({
      settings,
      message: "Platform settings updated successfully!",
    });
  } catch (error) {
    console.error("POST /api/admin/publishing/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
