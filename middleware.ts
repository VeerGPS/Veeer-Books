import { NextRequest, NextResponse } from "next/server";
import { CURRENCY_COOKIE, MULTI_CURRENCY, currencyForCountry, isCurrency } from "@/lib/currency";

// First visit: pick the shopper's currency from their country (Vercel geo header).
// India → INR, UK → GBP, everyone else → USD. Visitors can switch any time (cookie).
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const existing = req.cookies.get(CURRENCY_COOKIE)?.value;
  if (!MULTI_CURRENCY) {
    if (existing !== "INR") res.cookies.set(CURRENCY_COOKIE, "INR", { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" });
    return res;
  }
  if (!isCurrency(existing)) {
    const country = req.headers.get("x-vercel-ip-country") || (req as any).geo?.country || "";
    res.cookies.set(CURRENCY_COOKIE, currencyForCountry(country), {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  // Pages only — skip API routes, Next internals, readers and static files.
  matcher: ["/((?!api|_next/static|_next/image|readers|books|images|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
