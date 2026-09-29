"use client";

// Remembers a friend's referral code (from ?ref=CODE links) for 30 days.
const KEY = "vsb_ref";
const DAYS = 30;

export function saveRefCode(code: string) {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  if (!clean) return;
  try { localStorage.setItem(KEY, JSON.stringify({ code: clean, at: Date.now() })); } catch { /* ignore */ }
}

export function getRefCode(): string {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return "";
    const { code, at } = JSON.parse(raw);
    if (!code || Date.now() - Number(at) > DAYS * 86400_000) { localStorage.removeItem(KEY); return ""; }
    return String(code);
  } catch {
    return "";
  }
}

export function clearRefCode() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
