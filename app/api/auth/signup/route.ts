// POST /api/auth/signup
//
// Migrated 1:1 from the original server.js:
//   app.post("/api/auth/signup", async (req, res) => { ... })
//
// Behavior:
//   - require termsAccepted
//   - reject if email already verified
//   - create OR update existing unverified user (overwrite name + password)
//   - generate 6-digit OTP, hash it, store with 10 min expiry
//   - delete any prior OTPs for this email then create new one
//   - email the OTP

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User, OTP } from "@/models";
import { sendOTP } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { fullName, email, password, termsAccepted } = await req.json();

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the terms" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        fullName,
        email,
        password: hashedPassword,
        termsAccepted,
      });
      await user.save();
    } else {
      // Existing-but-unverified user: refresh credentials
      user.fullName = fullName;
      user.password = await bcrypt.hash(password, 10);
      user.termsAccepted = termsAccepted;
      await user.save();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    await OTP.deleteMany({ email });
    await OTP.create({ email, otpHash, expiresAt });
    const emailResult = await sendOTP(email, otp);

    if (!emailResult.success) {
      console.warn("[AUTH] Signup OTP email failed; continuing with fallback OTP", emailResult.error);
    }

    return NextResponse.json({
      message: emailResult.success ? "OTP sent" : "OTP generated but email delivery failed. Use the fallback code provided.",
      otp: emailResult.success ? undefined : otp,
    });
  } catch (err) {
    console.error("Signup Error Details:", err);
    return NextResponse.json(
      { error: "Signup failed on server" },
      { status: 500 }
    );
  }
}
