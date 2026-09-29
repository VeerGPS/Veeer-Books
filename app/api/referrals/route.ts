import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateReferralCode, referralStats } from "@/lib/referrals";
import { REFERRAL_FRIEND_PERCENT, REFERRAL_REWARD_DAYS, REFERRAL_REWARD_PERCENT } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// GET /api/referrals — the signed-in reader's referral code, link stats and reward coupons.
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const code = await getOrCreateReferralCode(auth.userId);
    const stats = await referralStats(auth.userId);
    return NextResponse.json({
      code,
      friendPercent: REFERRAL_FRIEND_PERCENT,
      rewardPercent: REFERRAL_REWARD_PERCENT,
      rewardDays: REFERRAL_REWARD_DAYS,
      ...stats,
    });
  } catch (e) {
    console.error("Referrals error:", e);
    return NextResponse.json({ error: "Could not load your referral link" }, { status: 500 });
  }
}
