// POST /api/subscribe — join the reading list and get The Shattered Sky free.
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Subscriber, User } from "@/models";
import { getOptionalAuth } from "@/lib/auth";
import { EMAIL_RE } from "@/lib/gift";
import { getGiftBook } from "@/lib/gift-server";
import { sendReaderEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

// Very small in-memory rate limit per server instance (bots / accidental repeats).
const hits = new Map<string, { n: number; at: number }>();
function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.at > 10 * 60_000) { hits.set(key, { n: 1, at: now }); return false; }
  h.n += 1;
  return h.n > 8;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const name = String(body.name || "").trim().slice(0, 80);
    const source = String(body.source || "site").replace(/[^a-z0-9_-]/gi, "").slice(0, 30) || "site";
    const GIFT_BOOK = await getGiftBook();
    if (body.website) return NextResponse.json({ ok: true, bookId: GIFT_BOOK?.id ?? null, slug: GIFT_BOOK?.slug ?? null }); // honeypot
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

    await connectDB();
    const auth = getOptionalAuth(req);

    let sub = await Subscriber.findOne({ email });
    const isNew = !sub;
    if (!sub) {
      sub = await Subscriber.create({
        email,
        name,
        source,
        giftBookId: GIFT_BOOK?.id,
        giftToken: crypto.randomBytes(18).toString("base64url"),
        referralCode: String(body.refCode || "").toUpperCase().slice(0, 20) || undefined,
      });
    } else {
      if (name && !sub.name) sub.name = name;
      sub.unsubscribed = false;
      await sub.save();
    }

    // Put the gift in the reader's account if they have one (signed in, or same email).
    const user = auth?.userId ? await User.findById(auth.userId) : await User.findOne({ email });
    // Free-book offer switched off in /admin/deals: they still join the reading list.
    if (!GIFT_BOOK) {
      return NextResponse.json({ ok: true, isNew, bookId: null, slug: null, savedToAccount: false });
    }
    if (sub.giftBookId !== GIFT_BOOK.id) { sub.giftBookId = GIFT_BOOK.id; await sub.save(); }

    if (user) {
      await User.updateOne({ _id: user._id }, { $addToSet: { purchasedBooks: GIFT_BOOK.id } });
      if (!sub.userId) { sub.userId = user._id; await sub.save(); }
    }

    sendReaderEmail({
      eventId: `gift-${sub._id}`,
      eventType: "FREE_GIFT",
      to: email,
      subject: `Your free book: ${GIFT_BOOK.title}`,
      headline: `${GIFT_BOOK.title} is yours 🎁`,
      paragraphs: [
        `Hi ${sub.name || "there"}, thanks for joining the Veeer Sukhadiya Books reading list.`,
        `Here’s your free copy of ${GIFT_BOOK.title} — ${GIFT_BOOK.pitch} Tap the button to start reading on any device.`,
        "We’ll only email you about new books, launch offers and the occasional reading tip.",
      ],
      button: { label: "Start reading", url: `/gift/claim?t=${sub.giftToken}` },
      footnote: "Tip: create a free account with this email and the book stays in your library on every device.",
    }).catch((e) => console.error("Gift email error:", e));

    return NextResponse.json({ ok: true, isNew, bookId: GIFT_BOOK.id, slug: GIFT_BOOK.slug, savedToAccount: Boolean(user) });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
