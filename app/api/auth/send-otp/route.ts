// POST /api/auth/send-otp — resend OTP for an existing unverified user.
// Migrated 1:1 from server.js.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User, OTP } from "@/models";
import { sendOTP } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    if (user.isVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    await OTP.deleteMany({ email });
    await OTP.create({ email, otpHash, expiresAt });
    const emailResult = await sendOTP(email, otp);

    if (!emailResult.success) {
      console.warn("[AUTH] Resend OTP email failed; continuing with fallback OTP", emailResult.error);
    }

    return NextResponse.json({
      message: emailResult.success ? "OTP sent successfully" : "OTP generated but email delivery failed. Use the fallback code provided.",
      otp: emailResult.success ? undefined : otp,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
