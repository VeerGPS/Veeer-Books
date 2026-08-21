import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AuthorRevenueLedger, AuthorProfile } from "@/models";
import { isAdminPasswordValid } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  if (!isAdminPasswordValid(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const ledger = await AuthorRevenueLedger.find({})
      .populate("authorId")
      .sort({ createdAt: -1 })
      .lean();

    const totalSalesCount = ledger.length;
    const totalGrossRevenue = ledger.reduce((sum, s) => sum + (s.grossAmount || 0), 0);
    const totalPlatformCommission = ledger.reduce((sum, s) => sum + (s.platformCommission || 0), 0);
    const totalAuthorPayouts = ledger.reduce((sum, s) => sum + (s.authorShare || 0), 0);
    const pendingSettlement = ledger
      .filter((s) => s.settlementStatus === "pending")
      .reduce((sum, s) => sum + (s.authorShare || 0), 0);
    const settledAmount = ledger
      .filter((s) => s.settlementStatus === "settled")
      .reduce((sum, s) => sum + (s.authorShare || 0), 0);

    return NextResponse.json({
      metrics: {
        totalSalesCount,
        totalGrossRevenue,
        totalPlatformCommission,
        totalAuthorPayouts,
        pendingSettlement,
        settledAmount,
      },
      ledger,
    });
  } catch (error) {
    console.error("GET /api/admin/publishing/sales error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales ledger" },
      { status: 500 }
    );
  }
}
