import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AuthorRevenueLedger } from "@/models";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function dayKey(d: Date) {
  // Calendar day in India time, so a sale at 11pm IST lands on the right day.
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/**
 * Sales & royalties report for the signed-in author.
 *   GET /api/author/reports?range=7|30|90|365|all&book=<bookId>
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "30";
  const book = url.searchParams.get("book");
  const days = range === "all" ? null : Math.min(730, Math.max(1, parseInt(range, 10) || 30));

  try {
    await connectDB();
    const query: Record<string, any> = { authorUserId: auth.userId };
    if (days) query.createdAt = { $gte: new Date(Date.now() - days * DAY) };
    if (book) query.bookId = Number(book);

    const rows = await AuthorRevenueLedger.find(query)
      .select("bookId bookTitle grossAmount platformCommission authorShare settlementStatus isBundleItem createdAt settledAt settlementReference")
      .sort({ createdAt: -1 })
      .lean();

    const totals = { units: 0, gross: 0, fees: 0, royalties: 0, pending: 0, settled: 0 };
    const byDay = new Map<string, { units: number; royalties: number; gross: number }>();
    const byTitle = new Map<number, { bookId: number; title: string; units: number; gross: number; royalties: number; bundleUnits: number }>();

    for (const r of rows) {
      totals.units += 1;
      totals.gross += r.grossAmount || 0;
      totals.fees += r.platformCommission || 0;
      totals.royalties += r.authorShare || 0;
      if (r.settlementStatus === "settled") totals.settled += r.authorShare || 0;
      else if (r.settlementStatus === "pending") totals.pending += r.authorShare || 0;

      const k = dayKey(new Date(r.createdAt));
      const d = byDay.get(k) || { units: 0, royalties: 0, gross: 0 };
      d.units += 1; d.royalties += r.authorShare || 0; d.gross += r.grossAmount || 0;
      byDay.set(k, d);

      const t = byTitle.get(r.bookId) || { bookId: r.bookId, title: r.bookTitle, units: 0, gross: 0, royalties: 0, bundleUnits: 0 };
      t.units += 1; t.gross += r.grossAmount || 0; t.royalties += r.authorShare || 0;
      if (r.isBundleItem) t.bundleUnits += 1;
      byTitle.set(r.bookId, t);
    }

    // Continuous daily series (zero-filled) for the chart.
    const series: { date: string; units: number; royalties: number; gross: number }[] = [];
    const span = days ?? (rows.length ? Math.ceil((Date.now() - new Date(rows[rows.length - 1].createdAt).getTime()) / DAY) + 1 : 30);
    for (let i = Math.min(span, 730) - 1; i >= 0; i--) {
      const k = dayKey(new Date(Date.now() - i * DAY));
      series.push({ date: k, ...(byDay.get(k) || { units: 0, royalties: 0, gross: 0 }) });
    }

    const round = (n: number) => Math.round(n * 100) / 100;
    return NextResponse.json({
      range,
      totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, round(v)])),
      series: series.map((s) => ({ ...s, royalties: round(s.royalties), gross: round(s.gross) })),
      titles: Array.from(byTitle.values()).map((t) => ({ ...t, gross: round(t.gross), royalties: round(t.royalties) })).sort((a, b) => b.royalties - a.royalties),
      orders: rows.slice(0, 200).map((r) => ({
        date: r.createdAt, bookId: r.bookId, title: r.bookTitle, gross: r.grossAmount, fee: r.platformCommission,
        royalty: r.authorShare, status: r.settlementStatus, bundle: !!r.isBundleItem, settledAt: r.settledAt, reference: r.settlementReference || "",
      })),
    });
  } catch (error) {
    console.error("GET /api/author/reports error:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
