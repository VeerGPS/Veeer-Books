"use client";

import React from "react";

const AGREEMENT_SECTIONS_LIST = [
  { id: "sec-1", num: 1, title: "Purpose of the Agreement", shortTitle: "Purpose" },
  { id: "sec-2", num: 2, title: "Author Ownership", shortTitle: "Author Ownership" },
  { id: "sec-3", num: 3, title: "Non-Exclusive Digital Publishing Licence", shortTitle: "Publishing Licence" },
  { id: "sec-4", num: 4, title: "Rights Covered by the Licence", shortTitle: "Rights Covered" },
  { id: "sec-5", num: 5, title: "Territory", shortTitle: "Territory" },
  { id: "sec-6", num: 6, title: "Duration", shortTitle: "Duration" },
  { id: "sec-7", num: 7, title: "Book Submission and Editorial Review", shortTitle: "Review" },
  { id: "sec-8", num: 8, title: "Manuscript Formatting and Conversion", shortTitle: "Formatting" },
  { id: "sec-9", num: 9, title: "Author Responsibilities", shortTitle: "Author Responsibilities" },
  { id: "sec-10", num: 10, title: "Copyright and Rights Declaration", shortTitle: "Copyright" },
  { id: "sec-11", num: 11, title: "Pricing", shortTitle: "Pricing" },
  { id: "sec-12", num: 12, title: "Royalty and Revenue Sharing", shortTitle: "Royalties" },
  { id: "sec-13", num: 13, title: "Bundles, Discounts and Promotions", shortTitle: "Promotions" },
  { id: "sec-14", num: 14, title: "Refunds, Reversals and Chargebacks", shortTitle: "Refunds & Reversals" },
  { id: "sec-15", num: 15, title: "Royalty Settlement", shortTitle: "Settlement" },
  { id: "sec-16", num: 16, title: "Taxes and Statutory Obligations", shortTitle: "Taxes" },
  { id: "sec-17", num: 17, title: "Marketing and Promotion", shortTitle: "Marketing" },
  { id: "sec-18", num: 18, title: "Author Marketing", shortTitle: "Author Marketing" },
  { id: "sec-19", num: 19, title: "Content Standards", shortTitle: "Content Standards" },
  { id: "sec-20", num: 20, title: "Copyright Complaints and Takedown Requests", shortTitle: "Copyright Complaints" },
  { id: "sec-21", num: 21, title: "Removal and Withdrawal of a Book", shortTitle: "Removal & Withdrawal" },
  { id: "sec-22", num: 22, title: "Author Representations", shortTitle: "Representations" },
  { id: "sec-23", num: 23, title: "Indemnification", shortTitle: "Indemnification" },
  { id: "sec-24", num: 24, title: "Platform Availability", shortTitle: "Availability" },
  { id: "sec-25", num: 25, title: "Platform Changes", shortTitle: "Platform Changes" },
  { id: "sec-26", num: 26, title: "Termination", shortTitle: "Termination" },
  { id: "sec-27", num: 27, title: "Electronic Acceptance", shortTitle: "Electronic Acceptance" },
  { id: "sec-28", num: 28, title: "Agreement Versioning", shortTitle: "Versioning" },
  { id: "sec-29", num: 29, title: "Changes to this Agreement", shortTitle: "Changes" },
  { id: "sec-30", num: 30, title: "Governing Law", shortTitle: "Governing Law" },
];

interface PublishingAgreementDocumentProps {
  version?: string;
  lastUpdated?: string;
}

export default function PublishingAgreementDocument({
  version = "VSB-DPA-1.0",
  lastUpdated = "August 2026",
}: PublishingAgreementDocumentProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ color: "#1e293b", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ─── DOCUMENT HEADER ─────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "2px solid var(--accent)",
          paddingBottom: "1.5rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span
            style={{
              color: "var(--accent-dark)",
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "0.82rem",
              letterSpacing: "2px",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            VEEER SUKHADIYA BOOKS
          </span>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(1.75rem, 3vw, 2.3rem)",
              fontWeight: 800,
              color: "var(--text-main)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Digital Publishing Agreement
          </h1>
        </div>

        <div style={{ textAlign: "right", fontSize: "0.88rem", color: "#64748b" }}>
          <div>
            Agreement Version: <strong style={{ color: "var(--accent-dark)" }}>{version}</strong>
          </div>
          <div>Last Updated: {lastUpdated}</div>
        </div>
      </div>

      {/* ─── TABLE OF CONTENTS ───────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#faf6f0",
          border: "1px solid #fae8c8",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--accent-dark)",
            marginTop: 0,
            marginBottom: "0.85rem",
          }}
        >
          📑 Table of Contents (30 Sections)
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.4rem 1rem",
            fontSize: "0.88rem",
          }}
        >
          {AGREEMENT_SECTIONS_LIST.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                padding: "3px 0",
                color: "#78350f",
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: 500,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {sec.num}. {sec.shortTitle}
            </button>
          ))}
        </div>
      </div>

      {/* ─── FULL 30 SECTIONS CONTENT ─────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#fffcf9",
          padding: "2.25rem 2rem",
          borderRadius: "14px",
          border: "1px solid var(--border)",
          lineHeight: 1.8,
          fontSize: "0.98rem",
          color: "#334155",
        }}
      >
        {/* Section 1 */}
        <section id="sec-1" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            1. PURPOSE OF THE AGREEMENT
          </h2>
          <p>
            Veeer Sukhadiya Books ("VeeerBooks", "we", "us", or "our") provides a digital publishing and distribution platform through which authors and publishers may submit eligible books for review and, if approved, make them available to readers through the Veeer Sukhadiya Books platform.
          </p>
          <p>
            Submission of a book does not guarantee acceptance, publication, sales, or earnings.
          </p>
          <p>
            Veeer Sukhadiya Books retains the right to review every submission before publication.
          </p>
        </section>

        {/* Section 2 */}
        <section id="sec-2" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            2. AUTHOR OWNERSHIP
          </h2>
          <p>
            The Author retains ownership of the copyright and intellectual property rights in their work unless otherwise expressly agreed in writing.
          </p>
          <p>
            Submitting a manuscript to Veeer Sukhadiya Books does not transfer ownership of the copyright to Veeer Sukhadiya Books.
          </p>
          <p>
            The Author represents that they are the author, copyright owner, publisher, or otherwise legally authorized to grant the rights required under this Agreement.
          </p>
        </section>

        {/* Section 3 */}
        <section id="sec-3" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            3. NON-EXCLUSIVE DIGITAL PUBLISHING LICENCE
          </h2>
          <p>
            For an approved work, the Author grants Veeer Sukhadiya Books a non-exclusive licence to use the submitted work for the purposes of operating, distributing, promoting, and providing the Veeer Sukhadiya Books digital publishing service.
          </p>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>This includes the right to:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0 1rem 0" }}>
            <li>Host the work on Veeer Sukhadiya Books infrastructure.</li>
            <li>Convert and format the manuscript into the Veeer Sukhadiya Books digital reading format.</li>
            <li>Reproduce the work as reasonably necessary to provide the digital reading service.</li>
            <li>Display the book title, cover, description, author name, metadata, and other submitted information.</li>
            <li>Make the book available for purchase or authorized access through Veeer Sukhadiya Books.</li>
            <li>Deliver purchased digital copies to authorized customers.</li>
            <li>Create and display reasonable previews or excerpts.</li>
            <li>Promote the book through Veeer Sukhadiya Books marketing channels.</li>
          </ul>
          <p>
            This licence does not transfer ownership of the underlying copyright to Veeer Sukhadiya Books.
          </p>
          <p>
            The Author remains free to publish or distribute the work elsewhere unless the parties separately agree otherwise in writing.
          </p>
        </section>

        {/* Section 4 */}
        <section id="sec-4" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            4. RIGHTS COVERED BY THE LICENCE
          </h2>
          <p>
            The licence granted under this Agreement is limited to the digital publishing, hosting, distribution, reader access, preview, and promotional activities reasonably necessary to operate the Veeer Sukhadiya Books platform.
          </p>
          <p>
            Veeer Sukhadiya Books does not acquire ownership of the Author's copyright through this Agreement.
          </p>
          <p>
            Any additional rights outside the scope of this Agreement must be separately agreed upon.
          </p>
        </section>

        {/* Section 5 */}
        <section id="sec-5" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            5. TERRITORY
          </h2>
          <p>
            Unless otherwise agreed in writing, the licence permits Veeer Sukhadiya Books to make the work available through its digital platform to customers who access the service.
          </p>
          <p>
            The Author confirms that they possess the necessary rights for the digital distribution contemplated by this Agreement.
          </p>
        </section>

        {/* Section 6 */}
        <section id="sec-6" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            6. DURATION
          </h2>
          <p>The licence remains effective while the book is published and available through Veeer Sukhadiya Books unless:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0 1rem 0" }}>
            <li>The Author requests withdrawal according to the applicable withdrawal procedure.</li>
            <li>Veeer Sukhadiya Books removes the book.</li>
            <li>The Agreement is terminated.</li>
            <li>The parties mutually agree otherwise.</li>
            <li>Continued distribution becomes legally or technically impossible.</li>
          </ul>
          <p>
            Rights and obligations that are intended to survive termination will continue to apply where appropriate.
          </p>
        </section>

        {/* Section 7 */}
        <section id="sec-7" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            7. BOOK SUBMISSION AND EDITORIAL REVIEW
          </h2>
          <p>Every submitted work is subject to review.</p>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Veeer Sukhadiya Books may review:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Manuscript quality</li>
            <li>Formatting</li>
            <li>Cover quality</li>
            <li>Metadata</li>
            <li>Copyright and ownership information</li>
            <li>Content suitability</li>
            <li>Technical compatibility</li>
            <li>Reader experience</li>
            <li>Compliance with platform policies</li>
          </ul>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Veeer Sukhadiya Books may:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Approve the submission.</li>
            <li>Request changes.</li>
            <li>Reject the submission.</li>
            <li>Suspend publication.</li>
            <li>Remove an already published work where permitted under this Agreement.</li>
          </ul>
          <p>Submission does not guarantee publication or sales.</p>
        </section>

        {/* Section 8 */}
        <section id="sec-8" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            8. MANUSCRIPT FORMATTING AND CONVERSION
          </h2>
          <p>
            For approved books, Veeer Sukhadiya Books may convert and format the submitted manuscript into its digital reader format.
          </p>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>This may include:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Typography adjustments</li>
            <li>Chapter formatting</li>
            <li>Layout adjustments</li>
            <li>Digital reader optimization</li>
            <li>Technical conversion</li>
            <li>Accessibility and readability improvements</li>
            <li>Creation of previews</li>
            <li>Technical corrections necessary for the reader</li>
          </ul>
          <p>
            Such formatting is intended to provide a consistent Veeer Sukhadiya Books reading experience.
          </p>
          <p>
            The Author remains responsible for the accuracy and originality of the underlying content.
          </p>
        </section>

        {/* Section 9 */}
        <section id="sec-9" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            9. AUTHOR RESPONSIBILITIES
          </h2>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>The Author is responsible for ensuring that:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>The submitted work is original or properly licensed.</li>
            <li>The Author possesses the necessary rights to publish and digitally distribute the work.</li>
            <li>The work does not knowingly infringe copyright, trademark, privacy, publicity, or other third-party rights.</li>
            <li>The submitted cover is owned by the Author or properly licensed.</li>
            <li>All book information supplied to Veeer Sukhadiya Books is accurate.</li>
            <li>Pricing information supplied by the Author is accurate.</li>
            <li>The submission complies with applicable law and platform policies.</li>
            <li>The Author promptly informs Veeer Sukhadiya Books if their rights to the work change.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="sec-10" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            10. COPYRIGHT AND RIGHTS DECLARATION
          </h2>
          <p>
            Before submitting a book, the Author must confirm that they own or have obtained the necessary rights and permissions to publish and digitally distribute the work.
          </p>
          <p>
            If the Author is submitting a work on behalf of another person or organization, the Author confirms that they have authority to do so.
          </p>
          <p>
            Veeer Sukhadiya Books may request supporting documentation where reasonably necessary.
          </p>
          <p>
            If a credible copyright or ownership concern arises, Veeer Sukhadiya Books may temporarily suspend or restrict publication while the matter is reviewed.
          </p>
        </section>

        {/* Section 11 */}
        <section id="sec-11" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            11. PRICING
          </h2>
          <p>
            The Author may propose a selling price within the pricing limits established by Veeer Sukhadiya Books.
          </p>
          <p>
            Veeer Sukhadiya Books may establish minimum or maximum pricing requirements and may introduce promotional pricing, discounts, coupons, bundles, or other promotional campaigns according to applicable platform and commercial terms.
          </p>
          <p>
            The amount used for royalty calculation may differ from the normal listed price where a book is sold through a discount, promotion, coupon, or bundle.
          </p>
        </section>

        {/* Section 12 */}
        <section id="sec-12" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            12. ROYALTY AND REVENUE SHARING
          </h2>
          <p>
            For each eligible sale of an external Author's book, Veeer Sukhadiya Books records the transaction in its royalty ledger.
          </p>
          <p>
            The applicable platform commission percentage will be the percentage configured by Veeer Sukhadiya Books and applicable to the transaction.
          </p>
          
          {/* Revenue Calculation Card */}
          <div style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "10px", padding: "1.25rem", margin: "1rem 0" }}>
            <strong style={{ color: "#166534", display: "block", marginBottom: "0.5rem" }}>Illustrative Example:</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.92rem", color: "#15803d" }}>
              <div>• Customer payment: <strong>₹200</strong></div>
              <div>• Platform commission: <strong>15%</strong></div>
              <div>• Platform share: <strong>₹30</strong></div>
              <div>• Author royalty: <strong>₹170</strong></div>
            </div>
          </div>

          <p style={{ fontSize: "0.9rem", color: "#64748b", fontStyle: "italic" }}>
            The example above is illustrative only. The actual commission percentage applicable to the Author's book will be shown or otherwise communicated through the applicable commercial terms. The commission percentage applicable to each transaction must be recorded in the royalty ledger.
          </p>
        </section>

        {/* Section 13 */}
        <section id="sec-13" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            13. BUNDLES, DISCOUNTS AND PROMOTIONS
          </h2>
          <p>
            Where a book is sold through a bundle, promotional campaign, discount, coupon, or other special offer, the amount attributable to the individual book may differ from its normal listed price.
          </p>
          <p>
            Veeer Sukhadiya Books will calculate the applicable book revenue according to its configured revenue-allocation rules.
          </p>
          <p>
            The Author acknowledges that the normal listed price is not necessarily the amount used to calculate royalties for discounted or bundled transactions.
          </p>
        </section>

        {/* Section 14 */}
        <section id="sec-14" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            14. REFUNDS, REVERSALS AND CHARGEBACKS
          </h2>
          <p>
            If a customer transaction is refunded, reversed, cancelled, or otherwise invalidated, the corresponding royalty entry may be adjusted.
          </p>
          <p>
            Any royalty previously recorded as payable may be placed on hold or adjusted where necessary.
          </p>
          <p>
            The royalty ledger will retain the relevant transaction history.
          </p>
        </section>

        {/* Section 15 */}
        <section id="sec-15" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            15. ROYALTY SETTLEMENT
          </h2>
          <p>
            Veeer Sukhadiya Books will maintain a royalty ledger for each participating Author.
          </p>
          <p>
            Author royalties will initially appear as pending or available according to the platform's accounting rules.
          </p>
          <p>
            Royalty payments will be handled manually by Veeer Sukhadiya Books during the applicable settlement process.
          </p>
          <p>
            Authors may request payment of their available royalty balance by contacting Veeer Sukhadiya Books through the designated royalty-support email.
          </p>
          <p>
            Veeer Sukhadiya Books will verify the Author's royalty balance before processing a payment.
          </p>
          <p>
            The platform may establish reasonable settlement schedules, minimum settlement thresholds, verification requirements, and payment procedures.
          </p>
          <p style={{ fontWeight: 600 }}>
            The website does not promise automatic or instant royalty payments.
          </p>
        </section>

        {/* Section 16 */}
        <section id="sec-16" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            16. TAXES AND STATUTORY OBLIGATIONS
          </h2>
          <p>
            The Author is responsible for providing accurate information required for applicable tax, invoicing, and settlement processes.
          </p>
          <p>
            Where required by applicable law, Veeer Sukhadiya Books may deduct, withhold, report, or otherwise process amounts required by law.
          </p>
          <p>
            The Author remains responsible for their own tax obligations arising from income received through the platform.
          </p>
        </section>

        {/* Section 17 */}
        <section id="sec-17" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            17. MARKETING AND PROMOTION
          </h2>
          <p>
            The Author permits Veeer Sukhadiya Books to use the following materials for reasonable promotion of the book and the platform:
          </p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Book title</li>
            <li>Author name or pen name</li>
            <li>Book cover</li>
            <li>Book description</li>
            <li>Short excerpts</li>
            <li>Author biography</li>
            <li>Public author profile information</li>
          </ul>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>This may include promotion through:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Veeer Sukhadiya Books website</li>
            <li>Social media</li>
            <li>Promotional graphics</li>
            <li>Email communications</li>
            <li>Advertising</li>
            <li>Book discovery pages</li>
            <li>Platform announcements</li>
          </ul>
          <p>
            This permission is limited to promoting the book and Veeer Sukhadiya Books services.
          </p>
        </section>

        {/* Section 18 */}
        <section id="sec-18" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            18. AUTHOR MARKETING
          </h2>
          <p>
            Authors are encouraged to promote their published books through their own audiences and marketing channels.
          </p>
          <p>
            Authors may share their official Veeer Sukhadiya Books book page and author page.
          </p>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Authors must not make false or misleading claims regarding:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Sales</li>
            <li>Reviews</li>
            <li>Rankings</li>
            <li>Guaranteed earnings</li>
            <li>Guaranteed publication</li>
            <li>Guaranteed readership</li>
          </ul>
        </section>

        {/* Section 19 */}
        <section id="sec-19" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            19. CONTENT STANDARDS
          </h2>
          <p>
            Veeer Sukhadiya Books may establish content guidelines governing works accepted onto the platform.
          </p>
          <p>
            A work may be rejected, suspended, or removed if it violates applicable law, third-party rights, platform rules, or reasonable content standards.
          </p>
        </section>

        {/* Section 20 */}
        <section id="sec-20" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            20. COPYRIGHT COMPLAINTS AND TAKEDOWN REQUESTS
          </h2>
          <p>
            If Veeer Sukhadiya Books receives a credible copyright, ownership, legal, or rights complaint concerning a published work, it may temporarily restrict access to the work while the matter is reviewed.
          </p>
          <p>
            The Author agrees to cooperate reasonably with investigations and provide relevant documentation when requested.
          </p>
          <p>
            If the Author is unable to establish the necessary rights, the book may be removed from the platform.
          </p>
        </section>

        {/* Section 21 */}
        <section id="sec-21" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            21. REMOVAL AND WITHDRAWAL OF A BOOK
          </h2>
          <p>
            An Author may request withdrawal of a published book through the applicable publishing dashboard or support process.
          </p>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Veeer Sukhadiya Books may suspend or remove a book where reasonably necessary because of:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>Copyright concerns</li>
            <li>Legal requirements</li>
            <li>Fraud</li>
            <li>Misrepresentation</li>
            <li>Policy violations</li>
            <li>Technical problems</li>
            <li>Security concerns</li>
            <li>Material breach of this Agreement</li>
          </ul>
          <p>
            Previously completed customer transactions and access may be handled according to applicable platform policies and legal obligations.
          </p>
        </section>

        {/* Section 22 */}
        <section id="sec-22" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            22. AUTHOR REPRESENTATIONS
          </h2>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>By submitting a work, the Author represents that:</p>
          <ol style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>They have the legal right to submit the work.</li>
            <li>They have authority to grant the licence described in this Agreement.</li>
            <li>The information provided to Veeer Sukhadiya Books is accurate.</li>
            <li>The work does not knowingly infringe third-party rights.</li>
            <li>They will not knowingly submit stolen, pirated, plagiarized, or unauthorized material.</li>
            <li>They will notify Veeer Sukhadiya Books if their rights to the work change.</li>
          </ol>
        </section>

        {/* Section 23 */}
        <section id="sec-23" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            23. INDEMNIFICATION
          </h2>
          <p>
            To the extent permitted by applicable law, the Author is responsible for claims arising from the Author's breach of their representations, warranties, or rights obligations under this Agreement.
          </p>
          <p style={{ fontSize: "0.9rem", color: "#64748b", fontStyle: "italic" }}>
            The final scope of this provision should be reviewed by qualified legal counsel.
          </p>
        </section>

        {/* Section 24 */}
        <section id="sec-24" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            24. PLATFORM AVAILABILITY
          </h2>
          <p>
            Veeer Sukhadiya Books will make reasonable efforts to maintain its publishing and reading services.
          </p>
          <p>
            However, continuous or uninterrupted availability cannot be guaranteed.
          </p>
          <p>
            The platform may experience maintenance, technical failures, updates, security incidents, or other interruptions.
          </p>
        </section>

        {/* Section 25 */}
        <section id="sec-25" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            25. PLATFORM CHANGES
          </h2>
          <p>
            Veeer Sukhadiya Books may update its technology, website, digital reader, publishing workflow, security systems, and other platform functionality.
          </p>
          <p>
            Reasonable efforts will be made to maintain compatibility with published books.
          </p>
        </section>

        {/* Section 26 */}
        <section id="sec-26" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            26. TERMINATION
          </h2>
          <p>
            Either party may terminate the publishing relationship according to the applicable termination procedure.
          </p>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Upon termination:</p>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.4rem 0 1rem 0" }}>
            <li>The book may be removed from new sales.</li>
            <li>Pending royalty obligations will be handled according to applicable settlement procedures.</li>
            <li>Previously completed customer transactions may remain recorded.</li>
            <li>Provisions intended to survive termination will continue to apply where appropriate.</li>
          </ul>
        </section>

        {/* Section 27 */}
        <section id="sec-27" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            27. ELECTRONIC ACCEPTANCE
          </h2>
          <p>
            The Author's electronic acceptance of this Agreement, together with the Author's account information, submission information, agreement version, timestamp, and associated records, may be retained as evidence of acceptance.
          </p>
          <p>
            The Author must actively accept the Agreement before submitting a book for publication.
          </p>
        </section>

        {/* Section 28 */}
        <section id="sec-28" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            28. AGREEMENT VERSIONING
          </h2>
          <p>
            The version of this Agreement accepted by the Author will be permanently associated with the applicable acceptance record and submission.
          </p>
          <p>
            If Veeer Sukhadiya Books publishes a new version of the Agreement, previously accepted versions will remain recorded and will not be silently replaced.
          </p>
          <p>
            Where appropriate, Authors may be required to accept a new version before making additional submissions.
          </p>
        </section>

        {/* Section 29 */}
        <section id="sec-29" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            29. CHANGES TO THIS AGREEMENT
          </h2>
          <p>
            Veeer Sukhadiya Books may update this Agreement from time to time.
          </p>
          <p>
            Material changes may require renewed acceptance where appropriate.
          </p>
          <p>
            The applicable agreement version and acceptance record will be maintained by the platform.
          </p>
        </section>

        {/* Section 30 */}
        <section id="sec-30" style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>
            30. GOVERNING LAW
          </h2>
          <p>
            This Agreement is intended to be governed by the applicable laws of India.
          </p>
          <p>
            The final jurisdiction, dispute-resolution mechanism, and other legal provisions should be finalized by qualified legal counsel before this Agreement is used as the definitive binding publishing contract.
          </p>
        </section>

        <hr style={{ margin: "2.5rem 0", borderColor: "var(--border)" }} />

        {/* ─── AUTHOR ACKNOWLEDGEMENT ───────────────────────────────── */}
        <div style={{ backgroundColor: "#faf8f5", padding: "1.75rem", borderRadius: "12px", border: "1px solid #ebdcc5", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginTop: 0, marginBottom: "1rem" }}>
            AUTHOR ACKNOWLEDGEMENT
          </h3>
          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
            By accepting this Agreement, the Author confirms that:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.92rem", color: "#334155" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ color: "#15803d", fontWeight: 700 }}>☑</span>
              <span>I confirm that I own or have obtained the necessary rights and permissions to publish and digitally distribute my work.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ color: "#15803d", fontWeight: 700 }}>☑</span>
              <span>I have read and agree to the Veeer Sukhadiya Books Digital Publishing Agreement.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ color: "#15803d", fontWeight: 700 }}>☑</span>
              <span>I understand that submission does not guarantee publication or sales.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ color: "#15803d", fontWeight: 700 }}>☑</span>
              <span>I understand that royalties are calculated according to the applicable revenue-sharing terms and that royalty payments are handled through the Veeer Sukhadiya Books settlement process.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ color: "#15803d", fontWeight: 700 }}>☑</span>
              <span>I confirm that the information I provide to Veeer Sukhadiya Books is accurate and complete.</span>
            </div>
          </div>
        </div>

        {/* ─── AGREEMENT RECORD ───────────────────────────────────────── */}
        <div style={{ backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem", fontSize: "0.9rem" }}>
          <h4 style={{ margin: "0 0 0.6rem 0", fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>AGREEMENT RECORD</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>• Agreement Version: <strong>{version}</strong></div>
            <div>• Last Updated: <strong>{lastUpdated}</strong></div>
          </div>
          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Acceptance records: Author / User ID, Author name, Agreement version, Acceptance timestamp, Related submission ID (where applicable), and technical audit metadata.
          </div>
        </div>
      </div>

      {/* ─── LEGAL NOTICE BOX ───────────────────────────────────────── */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem 1.25rem",
          borderRadius: "10px",
          backgroundColor: "#fafafa",
          border: "1px solid #e5e7eb",
          fontSize: "0.84rem",
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        <strong>Important Notice:</strong> This document is intended as a working digital publishing agreement for the Veeer Sukhadiya Books platform. It should be reviewed and approved by qualified legal counsel before being relied upon as the final legally binding publishing contract.
      </div>
    </div>
  );
}
