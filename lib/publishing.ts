/**
 * Author Studio — shared, client-safe publishing constants and helpers.
 * Used by the title-setup screens, the bookshelf and the API routes.
 */

export const MAX_CATEGORIES = 3;
export const MAX_KEYWORDS = 7;
export const DESCRIPTION_MIN = 150;
export const DESCRIPTION_MAX = 4000;
export const MANUSCRIPT_MAX_MB = 50;
export const COVER_MAX_MB = 10;
export const COVER_IDEAL = { width: 1600, height: 2560 };
export const COVER_MIN = { width: 625, height: 1000 };

export const AGE_GROUPS = [
  "All ages",
  "Children (up to 8)",
  "Kids (9–12)",
  "Teens (13–17)",
  "Adults (18+)",
];

export const CONTRIBUTOR_ROLES = ["Co-author", "Editor", "Illustrator", "Translator", "Foreword", "Narrator", "Photographer"];

export const AI_OPTIONS: { value: "none" | "ai_assisted" | "ai_generated"; label: string; help: string }[] = [
  { value: "none", label: "None", help: "I created all of it myself" },
  { value: "ai_assisted", label: "AI-assisted", help: "I used AI tools to edit, refine or brainstorm my own work" },
  { value: "ai_generated", label: "AI-generated", help: "Some content was created by an AI tool" },
];

export const DEFAULT_CATEGORIES = [
  "Mystery & Thriller",
  "Self-Help & Productivity",
  "Technology & AI",
  "Fiction & Literature",
  "Children's Literature",
  "Business & Entrepreneurship",
  "Poetry & Plays",
  "Education & Academics",
  "General",
];

export const DEFAULT_LANGUAGES = ["English", "Hindi", "Gujarati"];

export const MANUSCRIPT_EXTS = [".pdf", ".docx", ".doc", ".epub", ".txt", ".rtf"];
export const COVER_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export type StatusInfo = { label: string; tone: "neutral" | "info" | "warn" | "good" | "bad"; step: number; help: string };

/** Human status labels + where the title is in the journey (1 Draft → 5 Live). */
export const STATUS: Record<string, StatusInfo> = {
  DRAFT: { label: "Draft", tone: "neutral", step: 1, help: "Finish setup and submit for review." },
  SUBMITTED: { label: "In review", tone: "info", step: 2, help: "Our editors usually review within 3–5 working days." },
  RESUBMITTED: { label: "In review", tone: "info", step: 2, help: "Your updated version is with our editors." },
  UNDER_REVIEW: { label: "In review", tone: "info", step: 2, help: "An editor is reviewing your book now." },
  CHANGES_REQUESTED: { label: "Action needed", tone: "warn", step: 2, help: "Read the editor's notes, update and resubmit." },
  APPROVED: { label: "Approved", tone: "good", step: 3, help: "Approved — we're preparing your book for the reader." },
  FORMATTING: { label: "Preparing", tone: "info", step: 3, help: "We're formatting your book for the web reader." },
  QUALITY_CHECK: { label: "Final checks", tone: "info", step: 4, help: "A last quality check before going live." },
  READY_TO_PUBLISH: { label: "Ready to publish", tone: "good", step: 4, help: "Everything's ready — going live shortly." },
  PUBLISHED: { label: "Live", tone: "good", step: 5, help: "On sale in the store." },
  REJECTED: { label: "Not accepted", tone: "bad", step: 2, help: "See the editor's notes for the reason." },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral", step: 1, help: "You withdrew this title." },
};

export const JOURNEY = ["Draft", "Review", "Preparing", "Final checks", "Live"];

export function statusInfo(status?: string): StatusInfo {
  return STATUS[status || "DRAFT"] || STATUS.DRAFT;
}

export const EDITABLE_STATUSES = ["DRAFT", "CHANGES_REQUESTED"];

export function canEdit(status?: string) {
  return EDITABLE_STATUSES.includes(status || "DRAFT");
}

/** What the author earns on one sale. */
export function royaltyFor(price: number, commissionPercent: number) {
  const p = Math.max(0, Number(price) || 0);
  const fee = Math.round(p * (commissionPercent / 100) * 100) / 100;
  const earn = Math.round((p - fee) * 100) / 100;
  return { price: p, fee, earn, rate: 100 - commissionPercent };
}

/** Authors are paid on the last day of every month (30th or 31st; 28th/29th in February). */
export function nextPayoutDate(from: Date = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  return d;
}

export function payoutDateLabel(d: Date = nextPayoutDate()) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function inr(n: number, digits = 0) {
  return "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatBytes(n?: number) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export type SetupForm = {
  language: string;
  title: string;
  subtitle: string;
  seriesName: string;
  seriesNumber: string;
  edition: string;
  penName: string;
  contributors: { role: string; name: string }[];
  description: string;
  publishingRights: "own_copyright" | "public_domain";
  rightsConfirmed: boolean;
  ageGroup: string;
  matureContent: boolean;
  categories: string[];
  keywords: string[];
  aiText: "none" | "ai_assisted" | "ai_generated";
  aiImages: "none" | "ai_assisted" | "ai_generated";
  isbn: string;
  previewPercent: number;
  desiredPrice: string;
  actualPrice: string;
  bundleEligible: boolean;
  releaseOption: "on_approval" | "scheduled";
  scheduledReleaseDate: string;
  termsAccepted: boolean;
  accurateInfoConfirmed: boolean;
  authorNotes: string;
};

export const EMPTY_FORM: SetupForm = {
  language: "English",
  title: "",
  subtitle: "",
  seriesName: "",
  seriesNumber: "",
  edition: "",
  penName: "",
  contributors: [],
  description: "",
  publishingRights: "own_copyright",
  rightsConfirmed: false,
  ageGroup: "",
  matureContent: false,
  categories: [],
  keywords: ["", "", "", "", "", "", ""],
  aiText: "none",
  aiImages: "none",
  isbn: "",
  previewPercent: 10,
  desiredPrice: "",
  actualPrice: "",
  bundleEligible: true,
  releaseOption: "on_approval",
  scheduledReleaseDate: "",
  termsAccepted: false,
  accurateInfoConfirmed: false,
  authorNotes: "",
};

/** Map a saved submission back into the editable form. */
export function formFromSubmission(s: any): SetupForm {
  const kw = (s.keywords && s.keywords.length ? s.keywords : s.tags || []).slice(0, MAX_KEYWORDS);
  while (kw.length < MAX_KEYWORDS) kw.push("");
  const cats = (s.categories && s.categories.length ? s.categories : [s.category, s.subcategory]).filter(Boolean);
  return {
    ...EMPTY_FORM,
    language: s.language || "English",
    title: s.title || "",
    subtitle: s.subtitle || "",
    seriesName: s.seriesName || "",
    seriesNumber: s.seriesNumber ? String(s.seriesNumber) : "",
    edition: s.edition || "",
    penName: s.penName || "",
    contributors: (s.contributors || []).map((c: any) => ({ role: c.role || "Co-author", name: c.name || "" })),
    description: s.description || "",
    publishingRights: s.publishingRights || "own_copyright",
    rightsConfirmed: !!s.rightsConfirmed,
    ageGroup: s.ageGroup || s.intendedAudience || "",
    matureContent: !!s.matureContent,
    categories: Array.from(new Set(cats)).slice(0, MAX_CATEGORIES) as string[],
    keywords: kw,
    aiText: s.aiText || "none",
    aiImages: s.aiImages || "none",
    isbn: s.isbn || "",
    previewPercent: typeof s.previewPercent === "number" ? s.previewPercent : 10,
    desiredPrice: s.desiredPrice ? String(s.desiredPrice) : "",
    actualPrice: s.actualPrice && s.actualPrice !== s.desiredPrice ? String(s.actualPrice) : "",
    bundleEligible: s.bundleEligible !== false,
    releaseOption: s.releaseOption || "on_approval",
    scheduledReleaseDate: s.scheduledReleaseDate ? String(s.scheduledReleaseDate).slice(0, 10) : "",
    termsAccepted: !!s.termsAccepted,
    accurateInfoConfirmed: !!s.termsAccepted,
  };
}

export type TabCheck = { done: boolean; missing: string[] };

/** Per-tab readiness shown as the ✓ on each step, mirroring the server's submission check. */
export function checkTabs(
  f: SetupForm,
  files: { manuscript: boolean; cover: boolean },
  limits: { min: number; max: number }
): { details: TabCheck; content: TabCheck; pricing: TabCheck; ready: boolean } {
  const d: string[] = [];
  if (f.title.trim().length < 2) d.push("Book title");
  if (!f.penName.trim()) d.push("Author name");
  if (f.description.trim().length < 10) d.push("Description");
  if (!f.categories.length) d.push("At least one category");
  if (!f.ageGroup) d.push("Primary audience");
  if (!f.rightsConfirmed) d.push("Publishing rights confirmation");

  const c: string[] = [];
  if (!files.manuscript) c.push("Manuscript file");
  if (!files.cover) c.push("Book cover");

  const p: string[] = [];
  const price = Number(f.desiredPrice);
  if (!price) p.push("List price");
  else if (price < limits.min || price > limits.max) p.push(`Price between ₹${limits.min} and ₹${limits.max}`);
  if (f.actualPrice && Number(f.actualPrice) < price) p.push("Original price must be higher than list price");
  if (f.releaseOption === "scheduled" && !f.scheduledReleaseDate) p.push("Release date");
  if (!f.termsAccepted) p.push("Accept the publishing agreement");

  return {
    details: { done: d.length === 0, missing: d },
    content: { done: c.length === 0, missing: c },
    pricing: { done: p.length === 0, missing: p },
    ready: d.length + c.length + p.length === 0,
  };
}

/** Build the multipart body the submissions API expects. */
export function toFormData(
  f: SetupForm,
  action: "draft" | "submit" | "resubmit",
  files: { manuscript?: File | null; cover?: File | null },
  agreementVersion?: string
) {
  const fd = new FormData();
  const keywords = f.keywords.map((k) => k.trim()).filter(Boolean).slice(0, MAX_KEYWORDS);
  const cats = f.categories.slice(0, MAX_CATEGORIES);
  const price = Number(f.desiredPrice) || 0;
  const set = (k: string, v: string) => fd.append(k, v);

  set("action", action);
  set("title", f.title.trim());
  set("subtitle", f.subtitle.trim());
  set("penName", f.penName.trim());
  set("description", f.description.trim());
  set("language", f.language);
  set("category", cats[0] || "General");
  set("subcategory", cats[1] || "");
  set("categories", JSON.stringify(cats));
  set("tags", keywords.join(","));
  set("keywords", JSON.stringify(keywords));
  set("intendedAudience", f.ageGroup);
  set("ageGroup", f.ageGroup);
  set("matureContent", String(f.matureContent));
  set("seriesName", f.seriesName.trim());
  set("seriesNumber", f.seriesNumber.trim());
  set("edition", f.edition.trim());
  set("contributors", JSON.stringify(f.contributors.filter((c) => c.name.trim())));
  set("publishingRights", f.publishingRights);
  set("aiText", f.aiText);
  set("aiImages", f.aiImages);
  set("isbn", f.isbn.trim());
  set("previewPercent", String(f.previewPercent));
  set("desiredPrice", String(price));
  set("actualPrice", String(Number(f.actualPrice) || price));
  set("bundleEligible", String(f.bundleEligible));
  set("releaseOption", f.releaseOption);
  set("scheduledReleaseDate", f.releaseOption === "scheduled" ? f.scheduledReleaseDate : "");
  set("rightsConfirmed", String(f.rightsConfirmed));
  set("termsAccepted", String(f.termsAccepted));
  set("accurateInfoConfirmed", String(f.accurateInfoConfirmed || f.termsAccepted));
  if (f.authorNotes.trim()) set("authorNotes", f.authorNotes.trim());
  if (agreementVersion) set("agreementVersion", agreementVersion);
  if (files.manuscript) fd.append("manuscriptFile", files.manuscript);
  if (files.cover) fd.append("coverFile", files.cover);
  return fd;
}
