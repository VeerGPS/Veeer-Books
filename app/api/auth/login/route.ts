// POST /api/auth/login — preserved from server.js
// Returns JWT + purchasedBooks if credentials match an isVerified user.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { Subscriber, User } from "@/models";
import { generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    if (!user.isVerified) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    // A free gift claimed with this email before signing up joins the library now.
    let purchasedBooks = user.purchasedBooks || [];
    try {
      const sub = await Subscriber.findOne({ email: user.email, giftBookId: { $exists: true } }, { giftBookId: 1 }).lean();
      if (sub?.giftBookId && !purchasedBooks.includes(sub.giftBookId)) {
        await User.updateOne({ _id: user._id }, { $addToSet: { purchasedBooks: sub.giftBookId } });
        purchasedBooks = [...purchasedBooks, sub.giftBookId];
      }
    } catch (e) {
      console.warn("Gift merge on login failed:", e);
    }

    const token = generateToken(user._id.toString());
    return NextResponse.json({ token, purchasedBooks });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
