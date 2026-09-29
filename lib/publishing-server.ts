import { MAX_CATEGORIES, MAX_KEYWORDS } from "@/lib/publishing";

const AI = ["none", "ai_assisted", "ai_generated"];

function jsonList(v: FormDataEntryValue | null): any[] | undefined {
  if (v === null) return undefined;
  try {
    const parsed = JSON.parse(String(v));
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read the extended title-setup fields from a submission form.
 * Only keys actually present in the request are returned, so a partial
 * update never wipes fields the author didn't touch.
 */
export function parseExtendedFields(fd: FormData): Record<string, any> {
  const out: Record<string, any> = {};
  const str = (k: string, max = 300) => {
    const v = fd.get(k);
    if (v !== null) out[k] = String(v).trim().slice(0, max);
  };
  const bool = (k: string) => {
    const v = fd.get(k);
    if (v !== null) out[k] = String(v) === "true";
  };

  str("seriesName", 150);
  str("edition", 40);
  str("ageGroup", 60);
  str("isbn", 20);
  bool("matureContent");
  bool("bundleEligible");

  const sn = fd.get("seriesNumber");
  if (sn !== null) {
    const n = parseInt(String(sn), 10);
    out.seriesNumber = Number.isFinite(n) && n > 0 ? n : undefined;
  }

  const contributors = jsonList(fd.get("contributors"));
  if (contributors) {
    out.contributors = contributors
      .filter((c) => c && typeof c.name === "string" && c.name.trim())
      .slice(0, 10)
      .map((c) => ({ role: String(c.role || "Co-author").slice(0, 40), name: String(c.name).trim().slice(0, 120) }));
  }

  const categories = jsonList(fd.get("categories"));
  if (categories) {
    out.categories = Array.from(new Set(categories.map((c) => String(c).trim()).filter(Boolean))).slice(0, MAX_CATEGORIES);
  }

  const keywords = jsonList(fd.get("keywords"));
  if (keywords) {
    out.keywords = keywords.map((k) => String(k).trim().slice(0, 50)).filter(Boolean).slice(0, MAX_KEYWORDS);
  }

  const rights = fd.get("publishingRights");
  if (rights !== null) out.publishingRights = String(rights) === "public_domain" ? "public_domain" : "own_copyright";

  for (const k of ["aiText", "aiImages"]) {
    const v = fd.get(k);
    if (v !== null) out[k] = AI.includes(String(v)) ? String(v) : "none";
  }

  const pp = fd.get("previewPercent");
  if (pp !== null) {
    const n = Number(pp);
    out.previewPercent = Number.isFinite(n) ? Math.min(30, Math.max(0, Math.round(n))) : 10;
  }

  const ro = fd.get("releaseOption");
  if (ro !== null) out.releaseOption = String(ro) === "scheduled" ? "scheduled" : "on_approval";

  const rd = fd.get("scheduledReleaseDate");
  if (rd !== null) {
    const d = String(rd) ? new Date(String(rd)) : null;
    out.scheduledReleaseDate = d && !isNaN(d.getTime()) ? d : undefined;
  }

  return out;
}
