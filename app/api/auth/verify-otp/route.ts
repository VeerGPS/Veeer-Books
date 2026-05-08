// POST /api/auth/verify-otp
// Validates the OTP, marks user as verified, deletes OTP record,
// returns JWT + purchasedBooks.  Behavior preserved from server.js.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User, OTP } from "@/models";
import { generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp } = await req.json();

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await OTP.deleteOne({ email });

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const token = generateToken(user._id.toString());
    return NextResponse.json({ token, purchasedBooks: user.purchasedBooks });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
