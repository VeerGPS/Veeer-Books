import { NextResponse } from "next/server";
import { getRates } from "@/lib/fx";

export const revalidate = 3600;

// GET /api/fx — today's INR exchange rates used for US/UK prices.
export async function GET() {
  const rates = await getRates();
  return NextResponse.json({ rates }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
