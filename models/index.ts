// MongoDB schemas — preserved EXACTLY as in the original
// server/models/index.js to avoid any data-shape drift.

import mongoose, { Schema, model, Types } from "mongoose";

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

// ─── Book ──────────────────────────────────────────────────────────────────
export interface IBook {
  _id: Types.ObjectId;
  id: number;
  slug: string;
  title: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  price: number;
  color: string;
  accent: string;
  genre: string;
  pages: number;
  cover: string;
  reader: string;
  pdf: string;
  description: string;
  htmlContent: string;
  highlights: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    id: { type: Number, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    actualPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    color: { type: String, default: "#2c3e50" },
    accent: { type: String, default: "#1a252f" },
    genre: { type: String, default: "General" },
    pages: { type: Number, default: 0 },
    cover: { type: String, default: "/images/default-book.png" },
    reader: { type: String, default: "/readers/default-reader.html" },
    pdf: { type: String, default: "/books/default-book.pdf" },
    description: { type: String, required: true },
    htmlContent: { type: String, required: true },
    highlights: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Coupon ─────────────────────────────────────────────────────────────────
export interface ICoupon {
  _id: Types.ObjectId;
  code: string;
  discountPercent: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

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

// ─── Bundle ──────────────────────────────────────────────────────────────────
export interface IBundle {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  bookIds: number[];
  originalPrice: number;
  bundlePrice: number;
  badge: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bundleSchema = new Schema<IBundle>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    bookIds: [{ type: Number, required: true }],
    originalPrice: { type: Number, required: true, default: 0 },
    bundlePrice: { type: Number, required: true, default: 0 },
    badge: { type: String, default: "🔥 LIMITED TIME OFFER" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `mongoose.models.X || model("X", schema)` is the canonical pattern for Next.js
// hot-reload — without it, every reload tries to redefine the model and throws
// `OverwriteModelError`.
export const User = (mongoose.models.User as mongoose.Model<IUser>) || model<IUser>("User", userSchema);
export const OTP = (mongoose.models.OTP as mongoose.Model<IOTP>) || model<IOTP>("OTP", otpSchema);
export const BookModel = (mongoose.models.Book as mongoose.Model<IBook>) || model<IBook>("Book", bookSchema);
export const CouponModel = (mongoose.models.Coupon as mongoose.Model<ICoupon>) || model<ICoupon>("Coupon", couponSchema);
export const Order = (mongoose.models.Order as mongoose.Model<IOrder>) || model<IOrder>("Order", orderSchema);
export const BundleModel = (mongoose.models.Bundle as mongoose.Model<IBundle>) || model<IBundle>("Bundle", bundleSchema);


