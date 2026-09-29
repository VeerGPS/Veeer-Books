export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://veeerbooks.in").replace(/\/$/, "");
export const SITE_NAME = "Veeer Sukhadiya Books";

export function absUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}

/** Serialises JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
