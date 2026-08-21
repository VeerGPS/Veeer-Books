import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AuthorProfile, User } from "@/models";
import { requireAuth, getOptionalAuth } from "@/lib/auth";
import { notifyAdminNewAuthor } from "@/lib/email-service";
import { createInAppNotification } from "@/lib/notifications";
import { logPublishingAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const auth = getOptionalAuth(req);
  if (!auth) {
    return NextResponse.json({ profile: null, authenticated: false }, { status: 200 });
  }

  try {
    await connectDB();
    const profile = await AuthorProfile.findOne({ userId: auth.userId }).lean();
    return NextResponse.json({ profile, authenticated: true });
  } catch (error) {
    console.error("GET /api/author/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch author profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const user = await User.findById(auth.userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      fullName,
      penName,
      phone,
      country,
      website,
      biography,
      profilePhoto,
      socialLinks,
      authorType,
      paymentSettlementInfo,
    } = body;

    if (!penName || !penName.trim()) {
      return NextResponse.json(
        { error: "Pen Name / Author Name is required" },
        { status: 400 }
      );
    }

    let profile = await AuthorProfile.findOne({ userId: auth.userId });
    const isNew = !profile;

    let slug = profile?.slug;
    if (!slug) {
      const baseSlug = generateSlug(penName) || `author-${Date.now()}`;
      let candidateSlug = baseSlug;
      let counter = 1;
      while (await AuthorProfile.findOne({ slug: candidateSlug })) {
        candidateSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = candidateSlug;
    }

    if (!profile) {
      const created = await AuthorProfile.create({
        userId: auth.userId,
        fullName: fullName?.trim() || user.fullName,
        penName: penName.trim(),
        slug,
        email: user.email,
        phone: phone?.trim() || "",
        country: country?.trim() || "India",
        website: website?.trim() || "",
        biography: biography?.trim() || "",
        profilePhoto: profilePhoto?.trim() || "",
        socialLinks: socialLinks || {},
        authorType: authorType || "Individual Author",
        paymentSettlementInfo: paymentSettlementInfo || {},
        status: "active",
        legalDeclarationsAccepted: true,
        legalDeclarationsAcceptedAt: new Date(),
      });

      // Log audit
      await logPublishingAudit({
        actorUserId: auth.userId,
        actorRole: "author",
        actorName: created.penName,
        action: "AUTHOR_PROFILE_CREATED",
        notes: `Author profile created with pen name: "${created.penName}"`,
      });

      // Create author in-app notification
      await createInAppNotification({
        recipientUserId: auth.userId,
        recipientRole: "author",
        type: "AUTHOR_PROFILE_CREATED",
        title: "Author Profile Created 🎉",
        message: `Welcome to Veeer Sukhadiya Books! Your author profile "${created.penName}" has been successfully set up.`,
        link: "/author/dashboard",
      });

      // Send immediate admin notification email
      notifyAdminNewAuthor(created.toObject()).catch((err) =>
        console.error("Admin new author email error:", err)
      );

      return NextResponse.json({
        profile: created,
        message: "Author profile created successfully!",
      });
    }

    // Update existing profile
    profile.fullName = fullName?.trim() || profile.fullName;
    profile.penName = penName.trim();
    profile.phone = phone !== undefined ? phone.trim() : profile.phone;
    profile.country = country !== undefined ? country.trim() : profile.country;
    profile.website = website !== undefined ? website.trim() : profile.website;
    profile.biography = biography !== undefined ? biography.trim() : profile.biography;
    if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto.trim();
    if (socialLinks !== undefined) profile.socialLinks = socialLinks;
    if (authorType !== undefined) profile.authorType = authorType;
    if (paymentSettlementInfo !== undefined) {
      profile.paymentSettlementInfo = {
        ...profile.paymentSettlementInfo,
        ...paymentSettlementInfo,
      };
    }
    await profile.save();

    // Log audit
    await logPublishingAudit({
      actorUserId: auth.userId,
      actorRole: "author",
      actorName: profile.penName,
      action: "AUTHOR_PROFILE_UPDATED",
      notes: `Author profile updated for: "${profile.penName}"`,
    });

    // Send admin notification email for profile update
    notifyAdminNewAuthor(profile.toObject(), true).catch((err) =>
      console.error("Admin author profile update email error:", err)
    );

    return NextResponse.json({
      profile,
      message: "Profile updated successfully!",
    });
  } catch (error) {
    console.error("POST /api/author/profile error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save author profile" },
      { status: 500 }
    );
  }
}
