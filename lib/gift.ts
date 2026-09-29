/** The free book readers get for joining the email list. */
export const GIFT_BOOK = {
  id: 3,
  slug: "the-shattered-sky",
  title: "The Shattered Sky",
  cover: "/images/shattered-sky.jpg",
  pages: 52,
  price: 110,
  pitch: "A breathtaking fantasy saga where courage and imagination collide in a broken realm.",
} as const;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
