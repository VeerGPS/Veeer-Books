// JWT helpers + an `requireAuth` shim usable from Next.js Route Handlers.
// Behavior preserved from the original server.js:
//   - reads `Authorization: Bearer <token>` header
//   - signs/verifies with process.env.JWT_SECRET
//   - tokens valid for 7 days

import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "";

export function generateToken(userId: string): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string } {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.verify(token, JWT_SECRET) as { id: string };
}

/**
 * Extract & verify the Bearer token from a Next.js request.
 *
 * Returns `{ userId }` on success, or a `NextResponse` (401) that the
 * caller should return immediately on failure. Callers do:
 *
 *     const auth = requireAuth(req);
 *     if (auth instanceof NextResponse) return auth;
 *     // …use auth.userId
 */
export function requireAuth(
  req: NextRequest
): { userId: string } | NextResponse {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    return { userId: decoded.id };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

/**
 * Extract & verify the Bearer token optionally.
 * Returns `{ userId }` on valid token, or `null` if absent/invalid/expired.
 */
export function getOptionalAuth(
  req: NextRequest
): { userId: string } | null {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    return { userId: decoded.id };
  } catch {
    return null;
  }
}
