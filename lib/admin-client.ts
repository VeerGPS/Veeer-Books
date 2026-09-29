"use client";

// The admin password is never shipped in the JavaScript bundle. The admin types it,
// the server checks it, and it is kept only for this browser tab's session.
const KEY = "vsb_admin_key";
let memo = "";

export function adminKey(): string {
  if (memo) return memo;
  try { memo = sessionStorage.getItem(KEY) || ""; } catch { /* storage unavailable */ }
  return memo;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const pw = (password || "").trim();
  if (!pw) return false;
  try {
    const res = await fetch("/api/admin/verify", { method: "POST", headers: { "x-admin-password": pw } });
    if (!res.ok) return false;
    memo = pw;
    try { sessionStorage.setItem(KEY, pw); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}
