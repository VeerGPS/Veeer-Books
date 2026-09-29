"use client";

import Link from "next/link";
import StudioShell, { useStudio } from "@/components/studio/StudioShell";
import {
  COVER_EXTS, COVER_IDEAL, COVER_MAX_MB, COVER_MIN, DESCRIPTION_MAX, DESCRIPTION_MIN,
  MANUSCRIPT_EXTS, MANUSCRIPT_MAX_MB, MAX_CATEGORIES, MAX_KEYWORDS, inr, royaltyFor,
} from "@/lib/publishing";

export default function HelpPage() {
  return (
    <StudioShell>
      <Help />
    </StudioShell>
  );
}

const TOPICS = [
  { id: "manuscript", label: "Preparing your manuscript" },
  { id: "cover", label: "Designing your cover" },
  { id: "metadata", label: "Title, description & keywords" },
  { id: "pricing", label: "Pricing & royalties" },
  { id: "review", label: "Review & going live" },
  { id: "guidelines", label: "Content guidelines" },
  { id: "faq", label: "FAQ" },
];

function Help() {
  const { data } = useStudio();
  const ps = data.platformSettings || {};
  const fee = ps.platformCommissionPercentage ?? 15;
  const min = ps.minBookPrice ?? 49;
  const max = ps.maxBookPrice ?? 9999;
  const ex = [99, 199, 299].map((p) => ({ p, r: royaltyFor(p, fee) }));

  return (
    <>
      <div className="studio-head">
        <div>
          <h1>Help & guides</h1>
          <p>Everything you need to publish a book readers will love.</p>
        </div>
        <Link href="/author/publish/new" className="s-btn s-btn-primary">Start a new title</Link>
      </div>

      <div className="setup-layout">
        <nav className="s-card s-card-pad setup-aside" aria-label="Help topics" style={{ alignSelf: "start", position: "sticky", top: 84 }}>
          <ul className="s-list">
            {TOPICS.map((t) => <li key={t.id}><a className="s-link" style={{ textDecoration: "none" }} href={`#${t.id}`}>{t.label}</a></li>)}
          </ul>
        </nav>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          <Section id="manuscript" title="Preparing your manuscript">
            <p>Upload the finished interior of your book. Our team converts it into the Veeer Books reader, so readers get the same layout on phone, tablet and desktop.</p>
            <ul>
              <li><b>Accepted files:</b> {MANUSCRIPT_EXTS.join(", ")} — up to {MANUSCRIPT_MAX_MB} MB. PDF keeps your layout exactly; DOCX gives the cleanest reflowable text.</li>
              <li><b>Include:</b> title page, copyright page, table of contents, and your chapters in order. Leave out blank pages and printer’s marks.</li>
              <li><b>Headings:</b> use the same style for every chapter heading (for example Word’s “Heading 1”) so we can build a clickable table of contents.</li>
              <li><b>Images:</b> embed them at 150–300 DPI. Avoid text inside images where you can — it can’t be searched or resized.</li>
              <li><b>Proofread first.</b> Once your book is live, changes need a new review.</li>
            </ul>
          </Section>

          <Section id="cover" title="Designing your cover">
            <p>Your cover is your book’s first impression, and in a store grid it’s shown about the size of a thumbnail.</p>
            <ul>
              <li><b>Size:</b> {COVER_IDEAL.width} × {COVER_IDEAL.height} px is ideal (a 1 : 1.6 ratio). Minimum {COVER_MIN.width} × {COVER_MIN.height} px.</li>
              <li><b>Files:</b> {COVER_EXTS.join(", ")} — up to {COVER_MAX_MB} MB, RGB colour.</li>
              <li><b>Readable small:</b> the title should still be legible at 120 px wide. Big type, strong contrast, one clear image.</li>
              <li><b>Match your details:</b> the title and author name on the cover must match what you enter in Book details.</li>
              <li><b>Don’t include</b> prices, “bestseller” claims you can’t back up, website URLs, or images you don’t have the rights to.</li>
            </ul>
          </Section>

          <Section id="metadata" title="Title, description & keywords">
            <ul>
              <li><b>Description:</b> {DESCRIPTION_MIN}–{DESCRIPTION_MAX} characters. Open with a hook, say who the book is for, and what they’ll get. Short paragraphs read best.</li>
              <li><b>Categories:</b> choose up to {MAX_CATEGORIES}. Pick the most specific ones that fit — that’s where readers browse.</li>
              <li><b>Keywords:</b> up to {MAX_KEYWORDS} words or short phrases readers would actually type, like “habit building for students”. Don’t repeat words already in your title, and never use other authors’ names.</li>
              <li><b>Series:</b> add a series name and number so readers can find the next book.</li>
            </ul>
          </Section>

          <Section id="pricing" title="Pricing & royalties">
            <p>You set the price between {inr(min)} and {inr(max)}. You earn <b>{100 - fee}%</b> of the price on every sale; the {fee}% platform fee covers payment processing, hosting, the reader, and customer support.</p>
            <div className="s-table-wrap" style={{ margin: "0.75rem 0" }}>
              <table className="s-table">
                <thead><tr><th>Price</th><th className="num">Platform fee</th><th className="num">You earn</th></tr></thead>
                <tbody>{ex.map((x) => <tr key={x.p}><td>{inr(x.p)}</td><td className="num">{inr(x.r.fee, 2)}</td><td className="num"><b>{inr(x.r.earn, 2)}</b></td></tr>)}</tbody>
              </table>
            </div>
            <ul>
              <li><b>Free preview:</b> readers can read a sample (10% by default) before buying. Longer previews often sell more.</li>
              <li><b>Bundles:</b> if you allow it, your book can be included in discounted bundles. Your royalty is based on your book’s share of the bundle price.</li>
              <li><b>Payouts:</b> royalties are paid on the <b>last day of every month</b> (30th or 31st; 28th or 29th in February) to the bank account or UPI ID in <Link className="s-link" href="/author/payments">Payments</Link>.</li>
              <li><b>Changing price:</b> edit the price any time from your Bookshelf — it updates after a quick check.</li>
            </ul>
          </Section>

          <Section id="review" title="Review & going live">
            <ol>
              <li><b>Submit</b> — once all three steps are complete, press “Submit for review”.</li>
              <li><b>Review</b> — our team checks the manuscript, cover and details against the guidelines. If something needs fixing you’ll get a note explaining exactly what, and can resubmit.</li>
              <li><b>Preparing</b> — approved books are converted into the reader and quality-checked.</li>
              <li><b>Live</b> — your book appears in the store. Release immediately after approval, or pick a release date.</li>
            </ol>
            <p className="s-muted">You’ll get an email and a notification at every step. Track progress from your <Link className="s-link" href="/author/dashboard">Bookshelf</Link>.</p>
          </Section>

          <Section id="guidelines" title="Content guidelines">
            {ps.contentGuidelinesText ? (
              <div style={{ whiteSpace: "pre-wrap" }}>{ps.contentGuidelinesText}</div>
            ) : (
              <ul>
                <li>You must own or have the rights to everything in your book, including text, images and cover art.</li>
                <li>No content that promotes hate, violence, or illegal activity, and no sexual content involving minors.</li>
                <li>Mark mature content honestly so it’s shown to the right readers.</li>
                <li>Disclose if AI tools generated the text or images.</li>
                <li>Public-domain works need something new — an original translation, annotations or illustrations.</li>
              </ul>
            )}
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <div className="s-faq">
              {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </Section>

          <div className="s-card s-card-pad">
            <h3 className="s-card-title">Still stuck?</h3>
            <p className="s-muted">Write to us at <a className="s-link" href="mailto:veeersukhadiyabooks95@gmail.com">veeersukhadiyabooks95@gmail.com</a> with your book title and we’ll get back to you.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="s-card s-card-pad help-sec" style={{ scrollMarginTop: 84 }}>
      <h2 className="s-card-title" style={{ fontSize: "1.15rem" }}>{title}</h2>
      <div className="help-body">{children}</div>
    </section>
  );
}

const FAQ: [string, string][] = [
  ["Do I keep the rights to my book?", "Yes. You keep your copyright. You give Veeer Books a non-exclusive licence to sell the digital edition, so you’re free to publish elsewhere too."],
  ["Does it cost anything to publish?", "No. Publishing is free. We only take the platform fee when a copy sells."],
  ["How long does review take?", "Review time depends on the book and the queue. You’ll get an email and a notification the moment there’s an update."],
  ["Can I update my book after it’s live?", "Yes. Open the title from your Bookshelf and upload a new version. It goes through a short review before replacing the live edition,."],
  ["Do I need an ISBN?", "No. An ISBN is optional for digital books on Veeer Books. If you have one for this edition you can add it in Book details."],
  ["When do I get paid?", "On the last day of every month — the 30th or 31st (28th or 29th in February). All royalties pending on that day are sent to your bank account or UPI ID."],
  ["Can I unpublish?", "Yes. Contact us and we’ll remove the book from the store."],
  ["What happens to a draft I don’t finish?", "Drafts are saved automatically and stay on your Bookshelf until you submit or delete them."],
];
