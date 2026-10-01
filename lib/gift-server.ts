// The free "join the reading list" book, as configured in /admin/deals.
import { getAllBooks } from "@/lib/books";
import { getDeals } from "@/lib/deals";
import { GIFT_BOOK } from "@/lib/gift";
import { saleActiveFor, type GiftBookInfo, type PublicDeals } from "@/lib/deals-shared";

function firstSentence(s?: string) {
  const t = (s || "").trim();
  const m = t.match(/^.{20,200}?[.!?](\s|$)/);
  return (m ? m[0] : t.slice(0, 160)).trim();
}

/** The free book, or null when the free-book offer is switched off. */
export async function getGiftBook(): Promise<GiftBookInfo | null> {
  const deals = await getDeals();
  if (!deals.gift.enabled) return null;
  const books = await getAllBooks();
  const b = books.find((x) => x.id === deals.gift.bookId);
  if (!b) {
    if (deals.gift.bookId !== GIFT_BOOK.id) return null;
    return { ...GIFT_BOOK, pitch: deals.gift.pitch || GIFT_BOOK.pitch };
  }
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    cover: b.cover,
    pages: b.pages,
    price: b.regularPrice || b.price,
    pitch: deals.gift.pitch || (b.id === GIFT_BOOK.id ? GIFT_BOOK.pitch : "") || b.hook || firstSentence(b.description),
  };
}

/** Look up any book's gift details by id (for links sent before the admin changed the free book). */
export async function giftInfoById(id: number): Promise<GiftBookInfo | null> {
  const b = (await getAllBooks()).find((x) => x.id === id);
  if (b) return { id: b.id, slug: b.slug, title: b.title, cover: b.cover, pages: b.pages, price: b.regularPrice || b.price, pitch: b.hook || "" };
  return id === GIFT_BOOK.id ? { ...GIFT_BOOK } : null;
}

export async function getPublicDeals(): Promise<PublicDeals> {
  const [deals, gift] = await Promise.all([getDeals(), getGiftBook()]);
  return {
    gift,
    sale: { active: saleActiveFor(deals.sale), percent: deals.sale.percent, label: deals.sale.label, endsAt: deals.sale.endsAt, scope: deals.sale.scope },
    multiBuy: deals.multiBuy,
    firstOrder: deals.firstOrder,
    referral: deals.referral,
    bar: deals.bar,
    popups: deals.popups,
  };
}
