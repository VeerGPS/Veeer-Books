import { connectDB } from "@/lib/mongoose";
import { PlatformSettings, IPlatformSettings } from "@/models";
import { ADMIN_NOTIFICATION_EMAIL } from "@/lib/admin";

export const DEFAULT_PLATFORM_SETTINGS: Partial<IPlatformSettings> = {
  key: "main_config",
  platformCommissionPercentage: 15,
  supportedCurrencies: ["INR"],
  supportedCategories: [
    "Mystery & Thriller",
    "Self-Help & Productivity",
    "Technology & AI",
    "Fiction & Literature",
    "Children's Literature",
    "Business & Entrepreneurship",
    "Poetry & Plays",
    "Education & Academics",
    "General",
  ],
  supportedLanguages: ["English", "Hindi", "Gujarati"],
  minBookPrice: 49,
  maxBookPrice: 9999,
  adminNotificationEmail: ADMIN_NOTIFICATION_EMAIL,
  publishingAgreementText: `### Veeer Sukhadiya Books Digital Publishing Agreement

**1. Grant of Digital Rights**
The Author grants Veeer Sukhadiya Books a non-exclusive digital distribution right to sell, format, and host the submitted work across the Veeer Sukhadiya Books digital storefront and custom standalone browser readers.

**2. Editorial & Formatting Review**
All submitted manuscripts undergo human editorial review and quality checks before publication. Veeer Sukhadiya Books reserves the right to request revisions, edit formatting for reader compatibility, or reject submissions that violate community guidelines or lack verified rights.

**3. Pricing & Revenue Share**
The Author sets the selling price within platform limits. The net gross sale amount is split according to the active platform commission rate (e.g. 15% platform commission, 85% author share).

**4. Settlement & Payouts**
Author earnings accumulate in the revenue ledger upon verified customer checkout. Payouts are reconciled and settled per agreed platform settlement timelines.

**5. Copyright & Ownership**
The Author retains 100% copyright and intellectual property ownership of the content and manuscript at all times.`,
  contentGuidelinesText: `### Content Guidelines
- Original Work: You must be the original creator or authorized rights holder.
- Quality Standard: Upload complete, edited manuscripts with high-resolution covers.
- Prohibited Content: Plagiarism, hate speech, defamatory material, or unlawful content is strictly prohibited.`,
  authorTermsText: `### Author Terms of Service
By submitting a book to Veeer Sukhadiya Books, you agree to accurate representation, fair reader pricing, and standard marketplace terms.`,
};

export async function getPlatformSettings(): Promise<IPlatformSettings> {
  await connectDB();
  let settings = await PlatformSettings.findOne({ key: "main_config" }).lean();
  if (!settings) {
    const created = await PlatformSettings.create(DEFAULT_PLATFORM_SETTINGS);
    settings = created.toObject();
  }
  return settings as IPlatformSettings;
}

export async function getPlatformCommissionPercentage(): Promise<number> {
  try {
    const settings = await getPlatformSettings();
    return Number(settings.platformCommissionPercentage || 15);
  } catch (error) {
    console.warn("Failed to read platform commission, using default 15%:", error);
    return 15;
  }
}
