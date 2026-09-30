// POST /api/razorpay/verify  (auth required)
//
// Verifies the HMAC signature returned by Razorpay Checkout, marks the
// matching Order as paid, adds purchased book IDs to user's purchasedBooks,
// and records revenue ledger entries for external author marketplace books.

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectDB } from "@/lib/mongoose";
import {
  Order,
  User,
  BookModel,
  AuthorProfile,
  AuthorRevenueLedger,
  CouponModel,
} from "@/models";
import { rewardReferrer } from "@/lib/referrals";
import { requireAuth } from "@/lib/auth";
import { getPlatformCommissionPercentage } from "@/lib/platform-settings";
import { notifyNewBookSale } from "@/lib/email-service";
import { createInAppNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Bad signature" },
        { status: 400 }
      );
    }

    const before = await Order.findOne({ razorpayOrderId: razorpay_order_id }, { status: 1 }).lean();
    const firstConfirmation = Boolean(before && before.status !== "paid");

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, userId: auth.userId },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }

    await User.findByIdAndUpdate(auth.userId, {
      $addToSet: { purchasedBooks: { $each: order.items } },
    });

    // One-time side effects: coupon usage and referral reward.
    if (firstConfirmation) {
      try {
        if (order.couponCode) {
          await CouponModel.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
        }
        if (order.referrerUserId) {
          await rewardReferrer({ referrerUserId: String(order.referrerUserId), friendUserId: auth.userId, orderId: String(order._id) });
        }
      } catch (e) {
        console.error("Post-payment reward error:", e);
      }
    }

    // ─── Marketplace Revenue Attribution ──────────────────────────────────
    try {
      const commissionPercent = await getPlatformCommissionPercentage();
      // Royalties are always in INR. Order.amount is in the shopper's currency; amountInr is its INR value.
      const orderPaidInr = typeof (order as any).amountInr === "number" ? (order as any).amountInr : order.amount || 0;

      // Fetch all books in this order
      const orderBooks = await BookModel.find({ id: { $in: order.items } }).lean();
      const totalBookCatalogPrice = orderBooks.reduce(
        (sum, b) => sum + (b.sellingPrice || b.price || 0),
        0
      );

      for (const book of orderBooks) {
        if (book.publisherType === "external_author" && book.authorId) {
          const bookMSRP = book.sellingPrice || book.price || 0;
          
          // Calculate proportional discounted gross amount if part of bundle / coupon
          const grossAmount =
            totalBookCatalogPrice > 0
              ? (bookMSRP / totalBookCatalogPrice) * orderPaidInr
              : bookMSRP;

          const platformCommission = Number(
            ((grossAmount * commissionPercent) / 100).toFixed(2)
          );
          const authorShare = Number((grossAmount - platformCommission).toFixed(2));

          const author = await AuthorProfile.findById(book.authorId).lean();

          // Idempotent creation of ledger entry
          const existingLedger = await AuthorRevenueLedger.findOne({
            orderId: order._id,
            bookId: book.id,
          });

          if (!existingLedger && author) {
            await AuthorRevenueLedger.create({
              orderId: order._id,
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: order.razorpayPaymentId,
              customerId: auth.userId,
              authorId: author._id,
              authorUserId: author.userId,
              bookId: book.id,
              bookTitle: book.title,
              grossAmount: Number(grossAmount.toFixed(2)),
              commissionPercent,
              platformCommission,
              authorShare,
              settlementStatus: "pending",
            });

            // In-app notification for author
            await createInAppNotification({
              recipientUserId: author.userId,
              recipientRole: "author",
              type: "BOOK_SALE",
              title: "New Book Sale! 🎉",
              message: `You earned ₹${authorShare.toFixed(2)} on a new sale of "${book.title}".`,
              link: "/author/dashboard",
            });

            // Idempotent email dispatch to admin & author
            notifyNewBookSale({
              bookTitle: book.title,
              authorName: author.penName,
              orderId: order.razorpayOrderId,
              paymentId: order.razorpayPaymentId || razorpay_payment_id,
              grossAmount,
              platformCommission,
              authorShare,
              authorEmail: author.email,
            }).catch((err) => console.error("Sale email notification error:", err));
          }
        }
      }
    } catch (attributionError) {
      // Attribution error must NEVER fail the customer's checkout response
      console.error("Marketplace revenue attribution error:", attributionError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    return NextResponse.json(
      { ok: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
