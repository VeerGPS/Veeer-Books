// Lightweight helper that mirrors the original server.js
//     app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
//
// In Next.js Route Handlers, requests served from the *same origin* as the
// app don't need CORS at all (which is the intended deploy target).
// We only add headers if `ALLOWED_ORIGIN` is set, in case the API is
// called from a separate front-end during development.

import { NextResponse } from "next/server";

export function withCors(res: NextResponse): NextResponse {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }
  return res;
}
