import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateReferralCode, referralStats } from "@/lib/referrals";
import { getDeals } from "@/lib/deals";

export const dynamic = "force-dynamic";

// GET /api/referrals — the signed-in reader's referral code, link stats and reward coupons.
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const code = await getOrCreateReferralCode(auth.userId);
    const stats = await referralStats(auth.userId);
    const { referral } = await getDeals();
    return NextResponse.json({
      code,
      enabled: referral.enabled,
      friendPercent: referral.friendPercent,
      rewardPercent: referral.rewardPercent,
      rewardDays: referral.rewardDays,
      ...stats,
    });
  } catch (e) {
    console.error("Referrals error:", e);
    return NextResponse.json({ error: "Could not load your referral link" }, { status: 500 });
  }
}
