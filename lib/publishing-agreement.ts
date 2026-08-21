import { connectDB } from "@/lib/mongoose";
import {
  PublishingAgreementVersion,
  AgreementAcceptance,
  AuthorProfile,
  IPublishingAgreementVersion,
  IAgreementAcceptance,
} from "@/models";
import { Types } from "mongoose";
import { createInAppNotification } from "@/lib/notifications";
import { logPublishingAudit } from "@/lib/audit";
import { notifyAdminAgreementAccepted } from "@/lib/email-service";

export const DEFAULT_AGREEMENT_VERSION = "VSB-DPA-1.0";
export const DEFAULT_AGREEMENT_TITLE = "Digital Publishing Agreement";
export const DEFAULT_AGREEMENT_LAST_UPDATED = "August 2026";

export const FULL_AGREEMENT_TEXT = `## 1. PURPOSE OF THE AGREEMENT
Veeer Sukhadiya Books ("VeeerBooks", "we", "us", or "our") provides a digital publishing and distribution platform through which authors and publishers may submit eligible books for review and, if approved, make them available to readers through the Veeer Sukhadiya Books platform.

Submission of a book does not guarantee acceptance, publication, sales, or earnings.

Veeer Sukhadiya Books retains the right to review every submission before publication.

---

## 2. AUTHOR OWNERSHIP
The Author retains ownership of the copyright and intellectual property rights in their work unless otherwise expressly agreed in writing.

Submitting a manuscript to Veeer Sukhadiya Books does not transfer ownership of the copyright to Veeer Sukhadiya Books.

The Author represents that they are the author, copyright owner, publisher, or otherwise legally authorized to grant the rights required under this Agreement.

---

## 3. NON-EXCLUSIVE DIGITAL PUBLISHING LICENCE
For an approved work, the Author grants Veeer Sukhadiya Books a non-exclusive licence to use the submitted work for the purposes of operating, distributing, promoting, and providing the Veeer Sukhadiya Books digital publishing service.

This includes the right to:
• Host the work on Veeer Sukhadiya Books infrastructure.
• Convert and format the manuscript into the Veeer Sukhadiya Books digital reading format.
• Reproduce the work as reasonably necessary to provide the digital reading service.
• Display the book title, cover, description, author name, metadata, and other submitted information.
• Make the book available for purchase or authorized access through Veeer Sukhadiya Books.
• Deliver purchased digital copies to authorized customers.
• Create and display reasonable previews or excerpts.
• Promote the book through Veeer Sukhadiya Books marketing channels.

This licence does not transfer ownership of the underlying copyright to Veeer Sukhadiya Books.

The Author remains free to publish or distribute the work elsewhere unless the parties separately agree otherwise in writing.

---

## 4. RIGHTS COVERED BY THE LICENCE
The licence granted under this Agreement is limited to the digital publishing, hosting, distribution, reader access, preview, and promotional activities reasonably necessary to operate the Veeer Sukhadiya Books platform.

Veeer Sukhadiya Books does not acquire ownership of the Author's copyright through this Agreement.

Any additional rights outside the scope of this Agreement must be separately agreed upon.

---

## 5. TERRITORY
Unless otherwise agreed in writing, the licence permits Veeer Sukhadiya Books to make the work available through its digital platform to customers who access the service.

The Author confirms that they possess the necessary rights for the digital distribution contemplated by this Agreement.

---

## 6. DURATION
The licence remains effective while the book is published and available through Veeer Sukhadiya Books unless:
• The Author requests withdrawal according to the applicable withdrawal procedure.
• Veeer Sukhadiya Books removes the book.
• The Agreement is terminated.
• The parties mutually agree otherwise.
• Continued distribution becomes legally or technically impossible.

Rights and obligations that are intended to survive termination will continue to apply where appropriate.

---

## 7. BOOK SUBMISSION AND EDITORIAL REVIEW
Every submitted work is subject to review.

Veeer Sukhadiya Books may review:
• Manuscript quality
• Formatting
• Cover quality
• Metadata
• Copyright and ownership information
• Content suitability
• Technical compatibility
• Reader experience
• Compliance with platform policies

Veeer Sukhadiya Books may:
• Approve the submission.
• Request changes.
• Reject the submission.
• Suspend publication.
• Remove an already published work where permitted under this Agreement.

Submission does not guarantee publication or sales.

---

## 8. MANUSCRIPT FORMATTING AND CONVERSION
For approved books, Veeer Sukhadiya Books may convert and format the submitted manuscript into its digital reader format.

This may include:
• Typography adjustments
• Chapter formatting
• Layout adjustments
• Digital reader optimization
• Technical conversion
• Accessibility and readability improvements
• Creation of previews
• Technical corrections necessary for the reader

Such formatting is intended to provide a consistent Veeer Sukhadiya Books reading experience.

The Author remains responsible for the accuracy and originality of the underlying content.

---

## 9. AUTHOR RESPONSIBILITIES
The Author is responsible for ensuring that:
• The submitted work is original or properly licensed.
• The Author possesses the necessary rights to publish and digitally distribute the work.
• The work does not knowingly infringe copyright, trademark, privacy, publicity, or other third-party rights.
• The submitted cover is owned by the Author or properly licensed.
• All book information supplied to Veeer Sukhadiya Books is accurate.
• Pricing information supplied by the Author is accurate.
• The submission complies with applicable law and platform policies.
• The Author promptly informs Veeer Sukhadiya Books if their rights to the work change.

---

## 10. COPYRIGHT AND RIGHTS DECLARATION
Before submitting a book, the Author must confirm that they own or have obtained the necessary rights and permissions to publish and digitally distribute the work.

If the Author is submitting a work on behalf of another person or organization, the Author confirms that they have authority to do so.

Veeer Sukhadiya Books may request supporting documentation where reasonably necessary.

If a credible copyright or ownership concern arises, Veeer Sukhadiya Books may temporarily suspend or restrict publication while the matter is reviewed.

---

## 11. PRICING
The Author may propose a selling price within the pricing limits established by Veeer Sukhadiya Books.

Veeer Sukhadiya Books may establish minimum or maximum pricing requirements and may introduce promotional pricing, discounts, coupons, bundles, or other promotional campaigns according to applicable platform and commercial terms.

The amount used for royalty calculation may differ from the normal listed price where a book is sold through a discount, promotion, coupon, or bundle.

---

## 12. ROYALTY AND REVENUE SHARING
For each eligible sale of an external Author's book, Veeer Sukhadiya Books records the transaction in its royalty ledger.

The applicable platform commission percentage will be the percentage configured by Veeer Sukhadiya Books and applicable to the transaction.

Example:
• Customer payment: ₹200
• Platform commission: 15%
• Platform share: ₹30
• Author royalty: ₹170

The example above is illustrative only.

The actual commission percentage applicable to the Author's book will be shown or otherwise communicated through the applicable commercial terms.

The commission percentage applicable to each transaction must be recorded in the royalty ledger.

---

## 13. BUNDLES, DISCOUNTS AND PROMOTIONS
Where a book is sold through a bundle, promotional campaign, discount, coupon, or other special offer, the amount attributable to the individual book may differ from its normal listed price.

Veeer Sukhadiya Books will calculate the applicable book revenue according to its configured revenue-allocation rules.

The Author acknowledges that the normal listed price is not necessarily the amount used to calculate royalties for discounted or bundled transactions.

---

## 14. REFUNDS, REVERSALS AND CHARGEBACKS
If a customer transaction is refunded, reversed, cancelled, or otherwise invalidated, the corresponding royalty entry may be adjusted.

Any royalty previously recorded as payable may be placed on hold or adjusted where necessary.

The royalty ledger will retain the relevant transaction history.

---

## 15. ROYALTY SETTLEMENT
Veeer Sukhadiya Books will maintain a royalty ledger for each participating Author.

Author royalties will initially appear as pending or available according to the platform's accounting rules.

Royalty payments will be handled manually by Veeer Sukhadiya Books during the applicable settlement process.

Authors may request payment of their available royalty balance by contacting Veeer Sukhadiya Books through the designated royalty-support email.

Veeer Sukhadiya Books will verify the Author's royalty balance before processing a payment.

The platform may establish reasonable settlement schedules, minimum settlement thresholds, verification requirements, and payment procedures.

The website does not promise automatic or instant royalty payments.

---

## 16. TAXES AND STATUTORY OBLIGATIONS
The Author is responsible for providing accurate information required for applicable tax, invoicing, and settlement processes.

Where required by applicable law, Veeer Sukhadiya Books may deduct, withhold, report, or otherwise process amounts required by law.

The Author remains responsible for their own tax obligations arising from income received through the platform.

---

## 17. MARKETING AND PROMOTION
The Author permits Veeer Sukhadiya Books to use the following materials for reasonable promotion of the book and the platform:
• Book title
• Author name or pen name
• Book cover
• Book description
• Short excerpts
• Author biography
• Public author profile information

This may include promotion through:
• Veeer Sukhadiya Books website
• Social media
• Promotional graphics
• Email communications
• Advertising
• Book discovery pages
• Platform announcements

This permission is limited to promoting the book and Veeer Sukhadiya Books services.

---

## 18. AUTHOR MARKETING
Authors are encouraged to promote their published books through their own audiences and marketing channels.

Authors may share their official Veeer Sukhadiya Books book page and author page.

Authors must not make false or misleading claims regarding:
• Sales
• Reviews
• Rankings
• Guaranteed earnings
• Guaranteed publication
• Guaranteed readership

---

## 19. CONTENT STANDARDS
Veeer Sukhadiya Books may establish content guidelines governing works accepted onto the platform.

A work may be rejected, suspended, or removed if it violates applicable law, third-party rights, platform rules, or reasonable content standards.

---

## 20. COPYRIGHT COMPLAINTS AND TAKEDOWN REQUESTS
If Veeer Sukhadiya Books receives a credible copyright, ownership, legal, or rights complaint concerning a published work, it may temporarily restrict access to the work while the matter is reviewed.

The Author agrees to cooperate reasonably with investigations and provide relevant documentation when requested.

If the Author is unable to establish the necessary rights, the book may be removed from the platform.

---

## 21. REMOVAL AND WITHDRAWAL OF A BOOK
An Author may request withdrawal of a published book through the applicable publishing dashboard or support process.

Veeer Sukhadiya Books may suspend or remove a book where reasonably necessary because of:
• Copyright concerns
• Legal requirements
• Fraud
• Misrepresentation
• Policy violations
• Technical problems
• Security concerns
• Material breach of this Agreement

Previously completed customer transactions and access may be handled according to applicable platform policies and legal obligations.

---

## 22. AUTHOR REPRESENTATIONS
By submitting a work, the Author represents that:
1. They have the legal right to submit the work.
2. They have authority to grant the licence described in this Agreement.
3. The information provided to Veeer Sukhadiya Books is accurate.
4. The work does not knowingly infringe third-party rights.
5. They will not knowingly submit stolen, pirated, plagiarized, or unauthorized material.
6. They will notify Veeer Sukhadiya Books if their rights to the work change.

---

## 23. INDEMNIFICATION
To the extent permitted by applicable law, the Author is responsible for claims arising from the Author's breach of their representations, warranties, or rights obligations under this Agreement.

The final scope of this provision should be reviewed by qualified legal counsel.

---

## 24. PLATFORM AVAILABILITY
Veeer Sukhadiya Books will make reasonable efforts to maintain its publishing and reading services.

However, continuous or uninterrupted availability cannot be guaranteed.

The platform may experience maintenance, technical failures, updates, security incidents, or other interruptions.

---

## 25. PLATFORM CHANGES
Veeer Sukhadiya Books may update its technology, website, digital reader, publishing workflow, security systems, and other platform functionality.

Reasonable efforts will be made to maintain compatibility with published books.

---

## 26. TERMINATION
Either party may terminate the publishing relationship according to the applicable termination procedure.

Upon termination:
• The book may be removed from new sales.
• Pending royalty obligations will be handled according to applicable settlement procedures.
• Previously completed customer transactions may remain recorded.
• Provisions intended to survive termination will continue to apply where appropriate.

---

## 27. ELECTRONIC ACCEPTANCE
The Author's electronic acceptance of this Agreement, together with the Author's account information, submission information, agreement version, timestamp, and associated records, may be retained as evidence of acceptance.

The Author must actively accept the Agreement before submitting a book for publication.

---

## 28. AGREEMENT VERSIONING
The version of this Agreement accepted by the Author will be permanently associated with the applicable acceptance record and submission.

If Veeer Sukhadiya Books publishes a new version of the Agreement, previously accepted versions will remain recorded and will not be silently replaced.

Where appropriate, Authors may be required to accept a new version before making additional submissions.

---

## 29. CHANGES TO THIS AGREEMENT
Veeer Sukhadiya Books may update this Agreement from time to time.

Material changes may require renewed acceptance where appropriate.

The applicable agreement version and acceptance record will be maintained by the platform.

---

## 30. GOVERNING LAW
This Agreement is intended to be governed by the applicable laws of India.

The final jurisdiction, dispute-resolution mechanism, and other legal provisions should be finalized by qualified legal counsel before this Agreement is used as the definitive binding publishing contract.

---

## AUTHOR ACKNOWLEDGEMENT
By accepting this Agreement, the Author confirms that:
☑ I confirm that I own or have obtained the necessary rights and permissions to publish and digitally distribute my work.
☑ I have read and agree to the Veeer Sukhadiya Books Digital Publishing Agreement.
☑ I understand that submission does not guarantee publication or sales.
☑ I understand that royalties are calculated according to the applicable revenue-sharing terms and that royalty payments are handled through the Veeer Sukhadiya Books settlement process.
☑ I confirm that the information I provide to Veeer Sukhadiya Books is accurate and complete.

---

## AGREEMENT RECORD
• Agreement Version: VSB-DPA-1.0
• Last Updated: August 2026

Acceptance records:
• Author / User ID
• Author name
• Agreement version
• Acceptance timestamp
• Related submission ID where applicable
• Applicable technical audit information where lawfully collected
`;

export const DEFAULT_28_SECTION_AGREEMENT = FULL_AGREEMENT_TEXT;

export const AGREEMENT_SECTIONS_LIST = [
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

/**
 * Get or seed the active publishing agreement version
 */
export async function getActivePublishingAgreement(): Promise<{
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  summary?: string;
}> {
  await connectDB();

  let active = await PublishingAgreementVersion.findOne({ isActive: true }).lean();
  if (!active) {
    // Check if default version exists
    active = await PublishingAgreementVersion.findOne({ version: DEFAULT_AGREEMENT_VERSION }).lean();
    if (!active) {
      // Seed default active version
      const created = await PublishingAgreementVersion.create({
        version: DEFAULT_AGREEMENT_VERSION,
        title: DEFAULT_AGREEMENT_TITLE,
        content: FULL_AGREEMENT_TEXT,
        summary: "Initial Canonical Digital Publishing Agreement (30 Sections)",
        effectiveDate: new Date(),
        isActive: true,
        createdBy: "SYSTEM",
      });
      return {
        version: created.version,
        title: created.title,
        content: created.content,
        effectiveDate: created.effectiveDate,
        summary: created.summary,
      };
    } else {
      // Set default as active and ensure content is updated
      await PublishingAgreementVersion.updateOne(
        { version: DEFAULT_AGREEMENT_VERSION },
        { isActive: true, content: FULL_AGREEMENT_TEXT }
      );
    }
  }

  return {
    version: active.version,
    title: active.title,
    content: active.content || FULL_AGREEMENT_TEXT,
    effectiveDate: active.effectiveDate,
    summary: active.summary,
  };
}

/**
 * Get a specific agreement version
 */
export async function getAgreementByVersion(version: string) {
  await connectDB();
  const doc = await PublishingAgreementVersion.findOne({ version }).lean();
  return doc || null;
}

/**
 * Record immutable agreement acceptance
 */
export async function recordAgreementAcceptance(params: {
  userId: string | Types.ObjectId;
  authorId?: string | Types.ObjectId;
  agreementVersion: string;
  agreementTitle?: string;
  submissionId?: string | Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  acceptanceType: "dashboard_standalone" | "submission_workflow";
  rightsConfirmed?: boolean;
  accurateInfoConfirmed?: boolean;
}): Promise<IAgreementAcceptance> {
  await connectDB();

  const userObjectId = new Types.ObjectId(String(params.userId));
  let authorObjectId = params.authorId ? new Types.ObjectId(String(params.authorId)) : undefined;

  if (!authorObjectId) {
    const profile = await AuthorProfile.findOne({ userId: userObjectId }).lean();
    if (profile) authorObjectId = profile._id as Types.ObjectId;
  }

  const submissionObjectId = params.submissionId ? new Types.ObjectId(String(params.submissionId)) : undefined;

  const acceptance = await AgreementAcceptance.create({
    userId: userObjectId,
    authorId: authorObjectId,
    agreementVersion: params.agreementVersion,
    submissionId: submissionObjectId,
    acceptedAt: new Date(),
    ipAddress: params.ipAddress || "0.0.0.0",
    userAgent: params.userAgent || "Unknown",
    acceptanceType: params.acceptanceType,
    rightsConfirmed: params.rightsConfirmed ?? true,
    accurateInfoConfirmed: params.accurateInfoConfirmed ?? true,
  });

  // Update AuthorProfile status
  if (authorObjectId) {
    await AuthorProfile.findByIdAndUpdate(authorObjectId, {
      legalDeclarationsAccepted: true,
      legalDeclarationsAcceptedAt: new Date(),
    });
  }

  const author = await AuthorProfile.findOne({ userId: userObjectId }).lean();
  const authorName = author ? (author.penName || author.fullName) : "Author";

  // Audit trail
  await logPublishingAudit({
    actorUserId: userObjectId,
    actorRole: "author",
    actorName: authorName,
    action: "AGREEMENT_ACCEPTED",
    notes: `Accepted Publishing Agreement version ${params.agreementVersion} via ${params.acceptanceType}`,
    metadata: {
      agreementVersion: params.agreementVersion,
      submissionId: params.submissionId?.toString(),
    },
  });

  // In-app notification
  await createInAppNotification({
    recipientUserId: userObjectId,
    recipientRole: "author",
    title: "Publishing Agreement Accepted",
    message: `Your Veeer Sukhadiya Books publishing agreement (${params.agreementVersion}) has been accepted successfully.`,
    type: "AGREEMENT_ACCEPTED",
    link: "/author/dashboard",
  });

  // Dispatch milestone email
  if (author) {
    await notifyAdminAgreementAccepted(author as any, {
      agreementVersion: params.agreementVersion,
      acceptedAt: acceptance.acceptedAt,
      acceptanceType: params.acceptanceType,
      submissionId: params.submissionId?.toString(),
    });
  }

  return acceptance;
}

/**
 * Check if an author has accepted the active publishing agreement
 */
export async function getAuthorAgreementStatus(userId: string | Types.ObjectId): Promise<{
  isAccepted: boolean;
  acceptedRecord: {
    agreementVersion: string;
    acceptedAt: Date;
    acceptanceType?: string;
  } | null;
  activeAgreement: {
    version: string;
    title: string;
    content: string;
    effectiveDate: Date;
  };
}> {
  await connectDB();

  const userObjectId = new Types.ObjectId(String(userId));
  const activeAgreement = await getActivePublishingAgreement();

  // Find latest acceptance record for this user
  const latestAcceptance = await AgreementAcceptance.findOne({
    userId: userObjectId,
  })
    .sort({ acceptedAt: -1 })
    .lean();

  const isAccepted = Boolean(
    latestAcceptance &&
    (latestAcceptance.agreementVersion === activeAgreement.version ||
     latestAcceptance.agreementVersion.startsWith("VSB-DPA-"))
  );

  return {
    isAccepted,
    acceptedRecord: latestAcceptance
      ? {
          agreementVersion: latestAcceptance.agreementVersion,
          acceptedAt: latestAcceptance.acceptedAt,
          acceptanceType: latestAcceptance.acceptanceType,
        }
      : null,
    activeAgreement,
  };
}
