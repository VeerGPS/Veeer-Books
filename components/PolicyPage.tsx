import Link from "next/link";
import type { ReactNode } from "react";

type Card = { heading: string; body: ReactNode };

export default function PolicyPage({
  title,
  intro,
  cards,
  ctaText = "Back to Home",
  ctaHref = "/",
}: {
  title: string;
  intro: string;
  cards: Card[];
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <div className="policy-container fade-in">
      <div className="policy-header">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>

      {cards.map((card, idx) => (
        <div className="policy-card" key={idx}>
          <h3>{card.heading}</h3>
          <p>{card.body}</p>
        </div>
      ))}

      <Link href={ctaHref} className="btn btn-primary back-link">
        {ctaText}
      </Link>
    </div>
  );
}
