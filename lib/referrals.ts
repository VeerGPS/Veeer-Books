import crypto from "node:crypto";
import { connectDB } from "@/lib/mongoose";
import { CouponModel, Order, User } from "@/models";
import { sendReaderEmail } from "@/lib/email-service";
import { getDeals } from "@/lib/deals";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion

function randomCode(len: number) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  await connectDB();
  const user: any = await User.findById(userId, { referralCode: 1, fullName: 1 }).lean();
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;
  const stem = String(user.fullName || "READER").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "READER";
  for (let i = 0; i < 6; i++) {
    const code = `${stem}${randomCode(4)}`;
    try {
      const res = await User.updateOne({ _id: userId, referralCode: { $exists: false } }, { $set: { referralCode: code } });
      if (res.modifiedCount === 1) return code;
      const again: any = await User.findById(userId, { referralCode: 1 }).lean();
      if (again?.referralCode) return again.referralCode;
    } catch {
      /* duplicate code — try another */
    }
  }
  throw new Error("Could not create a referral code");
}

/** Gives the referrer a one-time reward coupon for a friend's first purchase (idempotent per order). */
export async function rewardReferrer({ referrerUserId, friendUserId, orderId }: { referrerUserId: string; friendUserId: string; orderId: string }) {
  await connectDB();
  if (referrerUserId === friendUserId) return;
  const { referral } = await getDeals();
  if (!referral.enabled) return;
  const REFERRAL_REWARD_DAYS = referral.rewardDays;
  const REFERRAL_REWARD_PERCENT = referral.rewardPercent;
  const note = `referral-reward:${orderId}`;
  if (await CouponModel.exists({ note })) return;

  await User.updateOne({ _id: friendUserId, referredBy: { $exists: false } }, { $set: { referredBy: referrerUserId } });

  const code = `THANKS${randomCode(6)}`;
  const expiresAt = new Date(Date.now() + REFERRAL_REWARD_DAYS * 86400_000);
  await CouponModel.create({
    code,
    discountPercent: REFERRAL_REWARD_PERCENT,
    active: true,
    ownerUserId: referrerUserId,
    maxUses: 1,
    usedCount: 0,
    expiresAt,
    note,
  });

  const referrer: any = await User.findById(referrerUserId, { email: 1, fullName: 1 }).lean();
  if (referrer?.email) {
    sendReaderEmail({
      eventId: `referral-reward-${orderId}`,
      eventType: "REFERRAL_REWARD",
      to: referrer.email,
      subject: `You earned ${REFERRAL_REWARD_PERCENT}% off — thanks for sharing!`,
      headline: `A friend just bought a book through your link 🎉`,
      paragraphs: [
        `Hi ${referrer.fullName || "there"}, thank you for recommending Veeer Sukhadiya Books.`,
        `Here’s your reward: ${REFERRAL_REWARD_PERCENT}% off your next purchase with the code ${code}. It works once and is valid until ${expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`,
      ],
      button: { label: "Use my reward", url: "/refer" },
    }).catch((e) => console.error("Referral reward email error:", e));
  }
}

export async function referralStats(userId: string) {
  await connectDB();
  const [friends, rewards] = await Promise.all([
    Order.distinct("userId", { referrerUserId: userId, status: "paid" }),
    CouponModel.find({ ownerUserId: userId }, { code: 1, discountPercent: 1, maxUses: 1, usedCount: 1, expiresAt: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);
  return {
    friends: friends.length,
    rewards: rewards.map((c: any) => ({
      code: c.code,
      percent: c.discountPercent,
      used: (c.usedCount || 0) >= (c.maxUses || 1),
      expired: c.expiresAt ? new Date(c.expiresAt) < new Date() : false,
      expiresAt: c.expiresAt,
    })),
  };
}
