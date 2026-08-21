// MongoDB schemas — preserved EXACTLY as in the original
// server/models/index.js to avoid any data-shape drift,
// with extensions for the Veeer Sukhadiya Books Managed Publishing Marketplace.

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
  // Managed Marketplace Extensions (optional & backwards-compatible)
  authorId?: Types.ObjectId;
  authorSlug?: string;
  authorBio?: string;
  submissionId?: Types.ObjectId;
  publisherType?: "in_house" | "external_author";
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
    authorId: { type: Schema.Types.ObjectId, ref: "AuthorProfile" },
    authorSlug: { type: String, lowercase: true, trim: true },
    authorBio: { type: String },
    submissionId: { type: Schema.Types.ObjectId, ref: "BookSubmission" },
    publisherType: { type: String, enum: ["in_house", "external_author"], default: "in_house" },
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

// ─── AuthorProfile ───────────────────────────────────────────────────────────
export interface IAuthorProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  penName: string;
  slug: string;
  email: string;
  phone?: string;
  country?: string;
  website?: string;
  biography?: string;
  profilePhoto?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
  };
  authorType: "Individual Author" | "Publisher";
  paymentSettlementInfo?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
    panOrTaxNumber?: string;
  };
  status: "active" | "suspended" | "pending";
  legalDeclarationsAccepted?: boolean;
  legalDeclarationsAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authorProfileSchema = new Schema<IAuthorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    penName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    website: { type: String, trim: true },
    biography: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    socialLinks: {
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    authorType: {
      type: String,
      enum: ["Individual Author", "Publisher"],
      default: "Individual Author",
    },
    paymentSettlementInfo: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
      panOrTaxNumber: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    legalDeclarationsAccepted: { type: Boolean, default: true },
    legalDeclarationsAcceptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── BookSubmission ──────────────────────────────────────────────────────────
export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "APPROVED"
  | "FORMATTING"
  | "QUALITY_CHECK"
  | "READY_TO_PUBLISH"
  | "PUBLISHED"
  | "REJECTED"
  | "WITHDRAWN";

export interface IBookSubmission {
  _id: Types.ObjectId;
  submissionId: string;
  authorId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  subtitle?: string;
  penName: string;
  description: string;
  category: string;
  subcategory?: string;
  language: string;
  intendedAudience?: string;
  tags: string[];
  publicationDetails?: string;
  
  manuscriptFile?: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
  };
  coverFile?: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
  };

  formattedReaderFile?: string;
  formattedPdfFile?: string;
  publishedBookId?: number;
  publishedBookSlug?: string;

  currency: string;
  desiredPrice: number;
  actualPrice?: number;

  rightsConfirmed: boolean;
  rightsConfirmedAt?: Date;
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  agreementVersion?: string;

  status: SubmissionStatus;
  adminFeedback?: string;
  internalNotes?: string;

  completenessPercentage: number;
  isDetailsCompleted: boolean;
  detailsCompletedAt?: Date;

  currentRevision: number;
  revisions: Types.ObjectId[];

  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const bookSubmissionSchema = new Schema<IBookSubmission>(
  {
    submissionId: { type: String, required: true, unique: true },
    authorId: { type: Schema.Types.ObjectId, ref: "AuthorProfile", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    penName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, default: "General" },
    subcategory: { type: String, default: "" },
    language: { type: String, default: "English" },
    intendedAudience: { type: String, default: "" },
    tags: [{ type: String }],
    publicationDetails: { type: String, default: "" },

    manuscriptFile: {
      originalName: { type: String },
      storagePath: { type: String },
      mimeType: { type: String },
      sizeBytes: { type: Number },
      uploadedAt: { type: Date },
    },
    coverFile: {
      originalName: { type: String },
      storagePath: { type: String },
      mimeType: { type: String },
      sizeBytes: { type: Number },
      uploadedAt: { type: Date },
    },

    formattedReaderFile: { type: String },
    formattedPdfFile: { type: String },
    publishedBookId: { type: Number },
    publishedBookSlug: { type: String },

    currency: { type: String, default: "INR" },
    desiredPrice: { type: Number, default: 0 },
    actualPrice: { type: Number, default: 0 },

    rightsConfirmed: { type: Boolean, default: false },
    rightsConfirmedAt: { type: Date },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    agreementVersion: { type: String, default: "VSB-DPA-1.0" },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "CHANGES_REQUESTED",
        "RESUBMITTED",
        "APPROVED",
        "FORMATTING",
        "QUALITY_CHECK",
        "READY_TO_PUBLISH",
        "PUBLISHED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "DRAFT",
    },
    adminFeedback: { type: String, default: "" },
    internalNotes: { type: String, default: "" },

    completenessPercentage: { type: Number, default: 0 },
    isDetailsCompleted: { type: Boolean, default: false },
    detailsCompletedAt: { type: Date },

    currentRevision: { type: Number, default: 1 },
    revisions: [{ type: Schema.Types.ObjectId, ref: "BookSubmissionRevision" }],

    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── BookSubmissionRevision ──────────────────────────────────────────────────
export interface IBookSubmissionRevision {
  _id: Types.ObjectId;
  submissionId: Types.ObjectId;
  revisionNumber: number;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  desiredPrice: number;
  actualPrice?: number;
  manuscriptFile?: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
  };
  coverFile?: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
  };
  authorNotes?: string;
  adminFeedbackAtTime?: string;
  statusAtRevision: string;
  submittedAt: Date;
}

const bookSubmissionRevisionSchema = new Schema<IBookSubmissionRevision>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "BookSubmission", required: true },
    revisionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    desiredPrice: { type: Number, default: 0 },
    actualPrice: { type: Number, default: 0 },
    manuscriptFile: {
      originalName: { type: String },
      storagePath: { type: String },
      mimeType: { type: String },
      sizeBytes: { type: Number },
    },
    coverFile: {
      originalName: { type: String },
      storagePath: { type: String },
      mimeType: { type: String },
      sizeBytes: { type: Number },
    },
    authorNotes: { type: String, default: "" },
    adminFeedbackAtTime: { type: String, default: "" },
    statusAtRevision: { type: String, default: "SUBMITTED" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── PublishingAuditLog ──────────────────────────────────────────────────────
export interface IPublishingAuditLog {
  _id: Types.ObjectId;
  submissionId?: Types.ObjectId;
  submissionCode?: string;
  bookId?: number;
  actorUserId?: Types.ObjectId;
  actorRole: "admin" | "author" | "system";
  actorName: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const publishingAuditLogSchema = new Schema<IPublishingAuditLog>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "BookSubmission" },
    submissionCode: { type: String },
    bookId: { type: Number },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, enum: ["admin", "author", "system"], default: "system" },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    previousStatus: { type: String },
    newStatus: { type: String },
    notes: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── AuthorRevenueLedger ─────────────────────────────────────────────────────
export interface IAuthorRevenueLedger {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  authorId: Types.ObjectId;
  authorUserId: Types.ObjectId;
  bookId: number;
  bookTitle: string;
  customerId: Types.ObjectId;
  currency: string;
  grossAmount: number;
  commissionPercent: number;
  platformCommission: number;
  authorShare: number;
  isBundleItem: boolean;
  bundleSlug?: string;
  settlementStatus: "pending" | "settled" | "on_hold";
  settledAt?: Date;
  settlementReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const authorRevenueLedgerSchema = new Schema<IAuthorRevenueLedger>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: "AuthorProfile", required: true },
    authorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: Number, required: true },
    bookTitle: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currency: { type: String, default: "INR" },
    grossAmount: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    platformCommission: { type: Number, required: true },
    authorShare: { type: Number, required: true },
    isBundleItem: { type: Boolean, default: false },
    bundleSlug: { type: String },
    settlementStatus: {
      type: String,
      enum: ["pending", "settled", "on_hold"],
      default: "pending",
    },
    settledAt: { type: Date },
    settlementReference: { type: String },
  },
  { timestamps: true }
);

// ─── PlatformSettings ────────────────────────────────────────────────────────
export interface IPlatformSettings {
  _id: Types.ObjectId;
  key: string;
  platformCommissionPercentage: number;
  supportedCurrencies: string[];
  supportedCategories: string[];
  supportedLanguages: string[];
  minBookPrice: number;
  maxBookPrice: number;
  adminNotificationEmail: string;
  publishingAgreementText: string;
  contentGuidelinesText: string;
  authorTermsText: string;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: "main_config" },
    platformCommissionPercentage: { type: Number, default: 15 },
    supportedCurrencies: [{ type: String }],
    supportedCategories: [{ type: String }],
    supportedLanguages: [{ type: String }],
    minBookPrice: { type: Number, default: 49 },
    maxBookPrice: { type: Number, default: 9999 },
    adminNotificationEmail: { type: String, default: "veeersukhadiyabooks95@gmail.com" },
    publishingAgreementText: { type: String, default: "" },
    contentGuidelinesText: { type: String, default: "" },
    authorTermsText: { type: String, default: "" },
  },
  { timestamps: true }
);

// ─── Notification ────────────────────────────────────────────────────────────
export interface INotification {
  _id: Types.ObjectId;
  recipientUserId: Types.ObjectId;
  recipientRole: "author" | "admin";
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientRole: { type: String, enum: ["author", "admin"], required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ─── EmailEvent (Idempotency & Failure-Safe Delivery) ─────────────────────────
export interface IEmailEvent {
  _id: Types.ObjectId;
  eventId: string;
  eventType: string;
  recipient: string;
  subject: string;
  authorId?: Types.ObjectId;
  submissionId?: Types.ObjectId;
  bookId?: number;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

const emailEventSchema = new Schema<IEmailEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "AuthorProfile" },
    submissionId: { type: Schema.Types.ObjectId, ref: "BookSubmission" },
    bookId: { type: Number },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    sentAt: { type: Date },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── PublishingAgreementVersion ─────────────────────────────────────────────
export interface IPublishingAgreementVersion {
  _id: Types.ObjectId;
  version: string; // e.g. "VSB-DPA-1.0", "VSB-DPA-1.1"
  title: string;
  content: string; // Full 28-section markdown/text
  summary?: string;
  effectiveDate: Date;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const publishingAgreementVersionSchema = new Schema<IPublishingAgreementVersion>(
  {
    version: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, default: "Veeer Sukhadiya Books Digital Publishing Agreement" },
    content: { type: String, required: true },
    summary: { type: String, default: "" },
    effectiveDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

// ─── AgreementAcceptance (Immutable Audit Record) ────────────────────────────
export interface IAgreementAcceptance {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  authorId: Types.ObjectId;
  agreementVersion: string;
  agreementTitle: string;
  acceptedAt: Date;
  submissionId?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  acceptanceType: "dashboard_standalone" | "submission_workflow";
  rightsConfirmed: boolean;
  accurateInfoConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const agreementAcceptanceSchema = new Schema<IAgreementAcceptance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "AuthorProfile", required: true },
    agreementVersion: { type: String, required: true, trim: true },
    agreementTitle: { type: String, default: "Veeer Sukhadiya Books Digital Publishing Agreement" },
    acceptedAt: { type: Date, default: Date.now, required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: "BookSubmission" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    acceptanceType: {
      type: String,
      enum: ["dashboard_standalone", "submission_workflow"],
      default: "dashboard_standalone",
    },
    rightsConfirmed: { type: Boolean, default: true },
    accurateInfoConfirmed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `mongoose.models.X || model("X", schema)` is the canonical pattern for Next.js hot-reload
export const User = (mongoose.models.User as mongoose.Model<IUser>) || model<IUser>("User", userSchema);
export const OTP = (mongoose.models.OTP as mongoose.Model<IOTP>) || model<IOTP>("OTP", otpSchema);
export const BookModel = (mongoose.models.Book as mongoose.Model<IBook>) || model<IBook>("Book", bookSchema);
export const CouponModel = (mongoose.models.Coupon as mongoose.Model<ICoupon>) || model<ICoupon>("Coupon", couponSchema);
export const Order = (mongoose.models.Order as mongoose.Model<IOrder>) || model<IOrder>("Order", orderSchema);
export const BundleModel = (mongoose.models.Bundle as mongoose.Model<IBundle>) || model<IBundle>("Bundle", bundleSchema);
export const AuthorProfile = (mongoose.models.AuthorProfile as mongoose.Model<IAuthorProfile>) || model<IAuthorProfile>("AuthorProfile", authorProfileSchema);
export const BookSubmission = (mongoose.models.BookSubmission as mongoose.Model<IBookSubmission>) || model<IBookSubmission>("BookSubmission", bookSubmissionSchema);
export const BookSubmissionRevision = (mongoose.models.BookSubmissionRevision as mongoose.Model<IBookSubmissionRevision>) || model<IBookSubmissionRevision>("BookSubmissionRevision", bookSubmissionRevisionSchema);
export const PublishingAuditLog = (mongoose.models.PublishingAuditLog as mongoose.Model<IPublishingAuditLog>) || model<IPublishingAuditLog>("PublishingAuditLog", publishingAuditLogSchema);
export const AuthorRevenueLedger = (mongoose.models.AuthorRevenueLedger as mongoose.Model<IAuthorRevenueLedger>) || model<IAuthorRevenueLedger>("AuthorRevenueLedger", authorRevenueLedgerSchema);
export const PlatformSettings = (mongoose.models.PlatformSettings as mongoose.Model<IPlatformSettings>) || model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);
export const Notification = (mongoose.models.Notification as mongoose.Model<INotification>) || model<INotification>("Notification", notificationSchema);
export const EmailEvent = (mongoose.models.EmailEvent as mongoose.Model<IEmailEvent>) || model<IEmailEvent>("EmailEvent", emailEventSchema);
export const PublishingAgreementVersion = (mongoose.models.PublishingAgreementVersion as mongoose.Model<IPublishingAgreementVersion>) || model<IPublishingAgreementVersion>("PublishingAgreementVersion", publishingAgreementVersionSchema);
export const AgreementAcceptance = (mongoose.models.AgreementAcceptance as mongoose.Model<IAgreementAcceptance>) || model<IAgreementAcceptance>("AgreementAcceptance", agreementAcceptanceSchema);
