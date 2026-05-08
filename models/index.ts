// MongoDB schemas — preserved EXACTLY as in the original
// server/models/index.js to avoid any data-shape drift.

import mongoose, { Schema, model, models, Types } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  isVerified: boolean;
  purchasedBooks: number[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    termsAccepted: { type: Boolean, required: true },
    isVerified: { type: Boolean, default: false },
    purchasedBooks: [{ type: Number }],
  },
  { timestamps: true }
);

// ─── OTP ─────────────────────────────────────────────────────────────────────
export interface IOTP {
  _id: Types.ObjectId;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}

const otpSchema = new Schema<IOTP>({
  email: { type: String, required: true, lowercase: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});
// Auto-expire OTPs at expiresAt (TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Order ───────────────────────────────────────────────────────────────────
export interface IOrder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "created" | "paid" | "failed";
  items: number[];
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    items: [{ type: Number }],
  },
  { timestamps: true }
);

// `models.X || model("X", schema)` is the canonical pattern for Next.js
// hot-reload — without it, every reload tries to redefine the model and throws
// `OverwriteModelError`.
export const User = (models.User as mongoose.Model<IUser>) || model<IUser>("User", userSchema);
export const OTP = (models.OTP as mongoose.Model<IOTP>) || model<IOTP>("OTP", otpSchema);
export const Order = (models.Order as mongoose.Model<IOrder>) || model<IOrder>("Order", orderSchema);
