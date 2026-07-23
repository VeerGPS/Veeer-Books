export const ADMIN_PASSWORD = "VSB95@veeerbooks.in";

export function isAdminPasswordValid(password: string | null | undefined) {
  return typeof password === "string" && password.trim() === ADMIN_PASSWORD;
}
