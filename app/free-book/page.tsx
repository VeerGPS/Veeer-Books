import type { Metadata } from "next";
import Link from "next/link";
import GiftSignup from "@/components/GiftSignup";
import { getGiftBook } from "@/lib/gift-server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const gift = await getGiftBook();
  if (!gift) return { title: "Free eBook", alternates: { canonical: "/free-book" } };
  return {
    title: `Free eBook: ${gift.title}`,
    description: `Get ${gift.title} — the complete eBook — free when you join the Veeer Sukhadiya Books reading list. Read instantly on any device.`,
    alternates: { canonical: "/free-book" },
    openGraph: { url: "/free-book", title: `Read ${gift.title} free`, images: [{ url: gift.cover }] },
  };
}

export default async function FreeBookPage() {
  const gift = await getGiftBook();
  if (!gift) {
    return (
      <main className="free-book">
        <section className="container" style={{ maxWidth: 640, padding: "4rem 16px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--serif)" }}>The free-book offer has ended</h1>
          <p className="muted">Thanks for your interest! Keep an eye out — new offers come often.</p>
          <Link href="/#collection" className="btn btn-primary">Browse all books</Link>
        </section>
      </main>
    );
  }
  return (
    <main className="free-book">
      <section className="container" style={{ maxWidth: 960, padding: "3.5rem 16px" }}>
        <GiftSignup variant="card" source="landing" />
        <div className="free-book-points">
          <div><b>The complete book</b><span>All {gift.pages} pages — not a sample.</span></div>
          <div><b>Read anywhere</b><span>Phone, tablet or laptop, with night and sepia modes.</span></div>
          <div><b>Yours to keep</b><span>Create a free account with the same email and it stays in your library.</span></div>
        </div>
        <p className="free-book-more">
          Already have it? <Link href={`/reader/${gift.slug}`}>Open the reader</Link> · Browse <Link href="/#collection">all books</Link>
        </p>
      </section>
    </main>
  );
}
