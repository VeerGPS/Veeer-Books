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
} from "@/models";
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

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
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

    // ─── Marketplace Revenue Attribution ──────────────────────────────────
    try {
      const commissionPercent = await getPlatformCommissionPercentage();
      const orderPaidInr = (order.amount || 0) / 100; // Razorpay amounts are in paise

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
              buyerUserId: auth.userId,
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
