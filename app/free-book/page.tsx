import type { Metadata } from "next";
import Link from "next/link";
import GiftSignup from "@/components/GiftSignup";
import { GIFT_BOOK } from "@/lib/gift";

export const metadata: Metadata = {
  title: `Free eBook: ${GIFT_BOOK.title}`,
  description: `Get ${GIFT_BOOK.title} — the complete fantasy eBook — free when you join the Veeer Sukhadiya Books reading list. Read instantly on any device.`,
  alternates: { canonical: "/free-book" },
  openGraph: { url: "/free-book", title: `Read ${GIFT_BOOK.title} free`, images: [{ url: GIFT_BOOK.cover }] },
};

export default function FreeBookPage() {
  return (
    <main className="free-book">
      <section className="container" style={{ maxWidth: 960, padding: "3.5rem 16px" }}>
        <GiftSignup variant="card" source="landing" />
        <div className="free-book-points">
          <div><b>The complete book</b><span>All {GIFT_BOOK.pages} pages — not a sample.</span></div>
          <div><b>Read anywhere</b><span>Phone, tablet or laptop, with night and sepia modes.</span></div>
          <div><b>Yours to keep</b><span>Create a free account with the same email and it stays in your library.</span></div>
        </div>
        <p className="free-book-more">
          Already have it? <Link href={`/reader/${GIFT_BOOK.slug}`}>Open the reader</Link> · Browse <Link href="/#collection">all books</Link>
        </p>
      </section>
    </main>
  );
}
