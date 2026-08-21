// Administrator credentials and helper functions.
// Prioritizes environment variables for security in production.

export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD?.trim() || "VSB95@veeerbooks.in";

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
  process.env.EMAIL_USER?.trim() ||
  "veeersukhadiyabooks95@gmail.com";

export function isAdminPasswordValid(password: string | null | undefined): boolean {
  if (typeof password !== "string" || !password.trim()) return false;
  return password.trim() === ADMIN_PASSWORD;
}
