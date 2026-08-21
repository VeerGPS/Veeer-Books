import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongoose";
import { EmailEvent, IAuthorProfile, IBookSubmission } from "@/models";
import { getPlatformSettings } from "@/lib/platform-settings";

const isProd = process.env.NODE_ENV === "production";

const hasSMTPConfig = () =>
  Boolean(
    process.env.EMAIL_HOST?.trim() &&
      process.env.EMAIL_USER?.trim() &&
      process.env.EMAIL_PASS?.trim()
  );

const createFallbackTransporter = () =>
  nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });

const createTransporter = async () => {
  if (!hasSMTPConfig()) {
    if (!isProd) {
      return createFallbackTransporter();
    }
    throw new Error(
      "Missing email configuration: EMAIL_HOST, EMAIL_USER, and EMAIL_PASS must be set"
    );
  }

  const host = process.env.EMAIL_HOST!;
  const port = Number(process.env.EMAIL_PORT) || 465;
  const user = process.env.EMAIL_USER!;
  const pass = process.env.EMAIL_PASS!;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "https://veeerbooks.in";
}

function renderEmailTemplate({
  headline,
  badgeText,
  badgeBg = "#c5a059",
  badgeColor = "#1a1a1a",
  intro,
  rows,
  buttons,
}: {
  headline: string;
  badgeText?: string;
  badgeBg?: string;
  badgeColor?: string;
  intro?: string;
  rows: { label: string; value: string }[];
  buttons?: { label: string; url: string; isPrimary?: boolean }[];
}) {
  const tableRowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; width: 38%; font-size: 14px;">${r.label}</td>
        <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 500;">${r.value}</td>
      </tr>`
    )
    .join("");

  const buttonsHtml = (buttons || [])
    .map(
      (b) => `
      <a href="${b.url}" style="display: inline-block; padding: 12px 24px; margin: 6px 8px 6px 0; background-color: ${
        b.isPrimary ? "#c5a059" : "#1e293b"
      }; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">${b.label}</a>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; line-height: 1.6;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
      <!-- Header -->
      <tr>
        <td style="background-color: #1a1a1a; padding: 24px 30px; text-align: center; border-bottom: 3px solid #c5a059;">
          <h1 style="color: #ffffff; font-family: Georgia, serif; font-size: 22px; margin: 0; letter-spacing: -0.5px;">Veeer Sukhadiya Books</h1>
          <span style="color: #c5a059; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; display: inline-block; margin-top: 4px;">Publishing Marketplace System</span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 30px 28px;">
          ${
            badgeText
              ? `<span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">${badgeText}</span>`
              : ""
          }
          <h2 style="font-family: Georgia, serif; font-size: 20px; color: #0f172a; margin: 0 0 12px 0;">${headline}</h2>
          ${intro ? `<p style="color: #475569; font-size: 15px; margin: 0 0 20px 0;">${intro}</p>` : ""}

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-collapse: collapse; background-color: #fafaf9; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${tableRowsHtml}
          </table>

          ${buttons && buttons.length > 0 ? `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">${buttonsHtml}</div>` : ""}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Veeer Sukhadiya Books. All rights reserved.</p>
          <p style="margin: 0;">This is an automated notification from the Veeer Sukhadiya Books Managed Publishing Platform.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export async function sendIdempotentEmail({
  eventId,
  eventType,
  recipient,
  subject,
  html,
  text,
  authorId,
  submissionId,
  bookId,
}: {
  eventId: string;
  eventType: string;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  authorId?: any;
  submissionId?: any;
  bookId?: number;
}) {
  try {
    await connectDB();

    // Check if event was already successfully sent
    const existing = await EmailEvent.findOne({ eventId });
    if (existing && existing.status === "sent") {
      console.info(`[EMAIL] Event ${eventId} (${eventType}) already sent. Skipping duplicate.`);
      return { success: true, skippedDuplicate: true };
    }

    const eventRecord =
      existing ||
      (await EmailEvent.create({
        eventId,
        eventType,
        recipient,
        subject,
        authorId,
        submissionId,
        bookId,
        status: "pending",
      }));

    try {
      const transporter = await createTransporter();
      const mailOptions = {
        from: `"Veeer Sukhadiya Books" <${process.env.EMAIL_USER ?? "noreply@veeerbooks.in"}>`,
        to: recipient,
        subject,
        html,
        text,
      };

      const info = await transporter.sendMail(mailOptions);
      eventRecord.status = "sent";
      eventRecord.sentAt = new Date();
      eventRecord.error = undefined;
      await eventRecord.save();

      if (!isProd && transporter.options && "streamTransport" in transporter.options) {
        console.info(`[DEV EMAIL] Idempotent Event ${eventType} sent:`, subject);
        console.info("[DEV EMAIL] Raw message:\n", (info as any).message?.toString?.());
      }

      return { success: true };
    } catch (sendError) {
      const errMessage = sendError instanceof Error ? sendError.message : String(sendError);
      console.error(`[EMAIL] Delivery failed for event ${eventId}:`, errMessage);
      eventRecord.status = "failed";
      eventRecord.error = errMessage;
      eventRecord.retryCount = (eventRecord.retryCount || 0) + 1;
      await eventRecord.save();
      return { success: false, error: errMessage };
    }
  } catch (dbError) {
    console.error(`[EMAIL] Failed to process email event ${eventId}:`, dbError);
    return { success: false, error: String(dbError) };
  }
}

// ─── HIGH-LEVEL NOTIFICATION DISPATCHERS ────────────────────────────────────

/** Event A: New Author Registered */
export async function notifyAdminNewAuthor(author: IAuthorProfile) {
  const settings = await getPlatformSettings();
  const recipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `author_reg_${author._id.toString()}`;

  const rows = [
    { label: "Author Full Name", value: author.fullName },
    { label: "Pen Name", value: author.penName },
    { label: "Email Address", value: author.email },
    { label: "Author Type", value: author.authorType },
    { label: "Author ID", value: author._id.toString() },
    { label: "Registered At", value: new Date(author.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Profile Status", value: author.status.toUpperCase() },
  ];

  const buttons = [
    { label: "View Public Profile", url: `${baseUrl}/author/${author.slug}`, isPrimary: true },
    { label: "Open Publishing Hub", url: `${baseUrl}/admin/publishing` },
  ];

  const html = renderEmailTemplate({
    headline: "New Author Registered",
    badgeText: "🎉 New Author Account",
    badgeBg: "#dcfce7",
    badgeColor: "#15803d",
    intro: "A new author has registered an author profile on the Veeer Sukhadiya Books publishing platform.",
    rows,
    buttons,
  });

  return sendIdempotentEmail({
    eventId,
    eventType: "NEW_AUTHOR_REGISTERED",
    recipient,
    subject: "🎉 New Author Registered | Veeer Sukhadiya Books",
    html,
    text: `New Author Registered: ${author.fullName} (${author.penName}) - ${author.email}. Review at ${baseUrl}/admin/publishing`,
    authorId: author._id,
  });
}

/** Event B: Book Details 100% Complete */
export async function notifyAdminBookDetailsCompleted(submission: IBookSubmission) {
  const settings = await getPlatformSettings();
  const recipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `book_details_100_${submission._id.toString()}_rev${submission.currentRevision || 1}`;

  const rows = [
    { label: "Book Title", value: submission.title },
    { label: "Author / Pen Name", value: submission.penName },
    { label: "Category", value: submission.category },
    { label: "Language", value: submission.language },
    { label: "Desired Price", value: `₹${submission.desiredPrice}` },
    { label: "Submission Code", value: submission.submissionId },
    { label: "Completeness", value: "100% Complete ✓" },
    { label: "Status", value: "Ready for Author Submission" },
  ];

  const buttons = [
    { label: "View Submission", url: `${baseUrl}/admin/publishing/${submission._id.toString()}`, isPrimary: true },
  ];

  const html = renderEmailTemplate({
    headline: `Book Details Completed: ${submission.title}`,
    badgeText: "📚 Details 100% Complete",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
    intro: "An author has completed all required manuscript, cover, pricing, and rights details (100% complete). The book is ready for submission.",
    rows,
    buttons,
  });

  return sendIdempotentEmail({
    eventId,
    eventType: "BOOK_DETAILS_COMPLETED",
    recipient,
    subject: `📚 Book Details Completed | Ready for Submission | Veeer Sukhadiya Books`,
    html,
    text: `Book Details Completed (100%): "${submission.title}" by ${submission.penName}. Submission ID: ${submission.submissionId}.`,
    authorId: submission.authorId,
    submissionId: submission._id,
  });
}

/** Event B2: Author Accepted Publishing Agreement */
export async function notifyAdminAgreementAccepted(
  author: IAuthorProfile,
  acceptance: {
    agreementVersion: string;
    acceptedAt: Date;
    acceptanceType?: string;
    submissionId?: string;
  }
) {
  const settings = await getPlatformSettings();
  const recipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `agreement_acc_${author._id.toString()}_${acceptance.agreementVersion.replace(/[^a-zA-Z0-9]/g, "_")}`;

  const rows = [
    { label: "Author Full Name", value: author.fullName },
    { label: "Pen Name", value: author.penName },
    { label: "Email Address", value: author.email },
    { label: "Agreement Version", value: acceptance.agreementVersion },
    { label: "Acceptance Type", value: acceptance.acceptanceType === "submission_workflow" ? "Book Submission Workflow" : "Author Dashboard (Standalone)" },
    { label: "Accepted Timestamp", value: new Date(acceptance.acceptedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Status", value: "AGREEMENT ACCEPTED & IMMUTABLE" },
  ];

  const buttons = [
    { label: "View Author Profile", url: `${baseUrl}/author/${author.slug}`, isPrimary: true },
    { label: "Open Publishing Hub", url: `${baseUrl}/admin/publishing` },
  ];

  const html = renderEmailTemplate({
    headline: `Publishing Agreement Accepted: ${author.penName}`,
    badgeText: "📜 Agreement Accepted",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
    intro: `Author ${author.penName} has officially accepted the Veeer Sukhadiya Books Digital Publishing Agreement (${acceptance.agreementVersion}).`,
    rows,
    buttons,
  });

  return sendIdempotentEmail({
    eventId,
    eventType: "AGREEMENT_ACCEPTED",
    recipient,
    subject: `📜 Publishing Agreement Accepted | ${author.penName} (${acceptance.agreementVersion})`,
    html,
    text: `Author ${author.penName} (${author.email}) accepted publishing agreement ${acceptance.agreementVersion} at ${new Date(acceptance.acceptedAt).toISOString()}.`,
    authorId: author._id,
  });
}

/** Event C: Book Submitted for Publication */
export async function notifyAdminBookSubmitted(submission: IBookSubmission) {
  const settings = await getPlatformSettings();
  const recipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `book_sub_${submission._id.toString()}_rev${submission.currentRevision || 1}`;

  const rows = [
    { label: "Author", value: submission.penName },
    { label: "Pen Name", value: submission.penName },
    { label: "Book", value: submission.title },
    { label: "Category", value: submission.category },
    { label: "Language", value: submission.language },
    { label: "Requested Price", value: `₹${submission.desiredPrice}` },
    { label: "Submission ID", value: submission.submissionId },
    { label: "Status", value: "SUBMITTED" },
  ];

  const adminReviewUrl = `${baseUrl}/admin/publishing/${submission._id.toString()}`;

  const buttons = [
    { label: "Review Submission", url: adminReviewUrl, isPrimary: true },
    { label: "Admin Publishing Hub", url: `${baseUrl}/admin/publishing` },
  ];

  const html = renderEmailTemplate({
    headline: "New Book Submission Ready for Review",
    badgeText: "📚 New Book Submission",
    badgeBg: "#fef3c7",
    badgeColor: "#b45309",
    intro: `Hello,<br><br>A new author has completed and submitted a book for publication through Veeer Sukhadiya Books.<br><br>The author has completed the required submission information and accepted the applicable publishing agreement. Please log in to the Admin Publishing Dashboard to review the manuscript, cover, metadata and submission details.`,
    rows,
    buttons,
  });

  const text = `Hello,

A new author has completed and submitted a book for publication through Veeer Sukhadiya Books.

Author:
${submission.penName}

Pen Name:
${submission.penName}

Book:
${submission.title}

Category:
${submission.category}

Language:
${submission.language}

Requested Price:
₹${submission.desiredPrice}

Submission ID:
${submission.submissionId}

Status:
SUBMITTED

The author has completed the required submission information and accepted the applicable publishing agreement.

Please log in to the Admin Publishing Dashboard to review the manuscript, cover, metadata and submission details.

Review Submission:
${adminReviewUrl}

Veeer Sukhadiya Books
Digital Publishing Marketplace`;

  return sendIdempotentEmail({
    eventId,
    eventType: "BOOK_SUBMITTED",
    recipient,
    subject: "📚 New Book Submission Ready for Review | Veeer Sukhadiya Books",
    html,
    text,
    authorId: submission.authorId,
    submissionId: submission._id,
  });
}

/** Event D: Book Resubmitted After Changes Requested */
export async function notifyAdminBookResubmitted(
  submission: IBookSubmission,
  previousFeedback?: string
) {
  const settings = await getPlatformSettings();
  const recipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `book_resub_${submission._id.toString()}_rev${submission.currentRevision}`;

  const rows = [
    { label: "Book Title", value: submission.title },
    { label: "Author / Pen Name", value: submission.penName },
    { label: "Submission Code", value: submission.submissionId },
    { label: "Revision Number", value: `Revision #${submission.currentRevision}` },
    { label: "Resubmission Date", value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Previous Feedback Addressed", value: previousFeedback || "Changes submitted as requested." },
    { label: "Status", value: "RESUBMITTED — REVIEW REQUIRED" },
  ];

  const buttons = [
    { label: "Review Revision", url: `${baseUrl}/admin/publishing/${submission._id.toString()}`, isPrimary: true },
  ];

  const html = renderEmailTemplate({
    headline: `Book Resubmitted: ${submission.title}`,
    badgeText: "🔄 Book Resubmitted",
    badgeBg: "#e0e7ff",
    badgeColor: "#4338ca",
    intro: "The author has updated their submission in response to requested changes and resubmitted for review.",
    rows,
    buttons,
  });

  return sendIdempotentEmail({
    eventId,
    eventType: "BOOK_RESUBMITTED",
    recipient,
    subject: `🔄 Book Resubmitted | ${submission.title}`,
    html,
    text: `Book Resubmitted: "${submission.title}" (Revision #${submission.currentRevision}) by ${submission.penName}.`,
    authorId: submission.authorId,
    submissionId: submission._id,
  });
}

/** Event E: Book Approved (Sent to Admin & Author) */
export async function notifyBookApproved(submission: IBookSubmission, authorEmail?: string) {
  const settings = await getPlatformSettings();
  const adminRecipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `book_appr_${submission._id.toString()}`;

  const rows = [
    { label: "Book Title", value: submission.title },
    { label: "Author / Pen Name", value: submission.penName },
    { label: "Submission Code", value: submission.submissionId },
    { label: "Approval Time", value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Next Stage", value: "MANUAL FORMATTING & READER PREPARATION" },
  ];

  const buttons = [
    { label: "Open Formatting Stage", url: `${baseUrl}/admin/publishing/${submission._id.toString()}`, isPrimary: true },
  ];

  const html = renderEmailTemplate({
    headline: `Book Approved: ${submission.title}`,
    badgeText: "✅ Approved",
    badgeBg: "#dcfce7",
    badgeColor: "#15803d",
    intro: "The book submission has been approved. It is now ready for manual manuscript conversion into the standalone reader format.",
    rows,
    buttons,
  });

  // Notify admin
  await sendIdempotentEmail({
    eventId,
    eventType: "BOOK_APPROVED",
    recipient: adminRecipient,
    subject: `✅ Book Approved | ${submission.title}`,
    html,
    text: `Book Approved: "${submission.title}" by ${submission.penName}. Ready for formatting.`,
    authorId: submission.authorId,
    submissionId: submission._id,
  });

  // Notify author if email available
  if (authorEmail) {
    const authorEventId = `author_book_appr_${submission._id.toString()}`;
    const authorHtml = renderEmailTemplate({
      headline: `Great News! Your Book "${submission.title}" is Approved`,
      badgeText: "🎉 Submission Approved",
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
      intro: "Congratulations! Our editorial team has approved your submission. We are now formatting your manuscript into our interactive browser reader experience.",
      rows: [
        { label: "Book Title", value: submission.title },
        { label: "Submission Code", value: submission.submissionId },
        { label: "Next Step", value: "Formatting & Quality Verification" },
      ],
      buttons: [
        { label: "View Submission Status", url: `${baseUrl}/author/dashboard`, isPrimary: true },
      ],
    });

    await sendIdempotentEmail({
      eventId: authorEventId,
      eventType: "AUTHOR_BOOK_APPROVED",
      recipient: authorEmail,
      subject: `🎉 Your Book "${submission.title}" Has Been Approved | Veeer Sukhadiya Books`,
      html: authorHtml,
      text: `Your book "${submission.title}" has been approved by Veeer Sukhadiya Books! We are now formatting your manuscript.`,
      authorId: submission.authorId,
      submissionId: submission._id,
    });
  }
}

/** Event F: Book Ready to Publish */
export async function notifyAdminBookReadyToPublish(submission: IBookSubmission) {
  const settings = await getPlatformSettings();
  const recipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `book_ready_${submission._id.toString()}`;

  const rows = [
    { label: "Book Title", value: submission.title },
    { label: "Author / Pen Name", value: submission.penName },
    { label: "Submission Code", value: submission.submissionId },
    { label: "Formatting Status", value: "Completed ✓" },
    { label: "Quality Check", value: "Passed ✓" },
    { label: "Action Required", value: "Ready for Storefront Publishing" },
  ];

  const buttons = [
    { label: "Publish Book Now", url: `${baseUrl}/admin/publishing/${submission._id.toString()}`, isPrimary: true },
  ];

  const html = renderEmailTemplate({
    headline: `Book Ready to Publish: ${submission.title}`,
    badgeText: "🚀 Ready to Publish",
    badgeBg: "#ede9fe",
    badgeColor: "#6d28d9",
    intro: "Manual formatting and quality checks have been completed successfully. You can now publish this book to the live storefront.",
    rows,
    buttons,
  });

  return sendIdempotentEmail({
    eventId,
    eventType: "BOOK_READY_TO_PUBLISH",
    recipient,
    subject: `🚀 Book Ready to Publish | ${submission.title}`,
    html,
    text: `Book Ready to Publish: "${submission.title}" by ${submission.penName}. Publish at ${baseUrl}/admin/publishing/${submission._id.toString()}`,
    authorId: submission.authorId,
    submissionId: submission._id,
  });
}

/** Event G: Book Published (Live in Store) */
export async function notifyBookPublished({
  submission,
  productSlug,
  bookPrice,
  authorEmail,
}: {
  submission: IBookSubmission;
  productSlug: string;
  bookPrice: number;
  authorEmail?: string;
}) {
  const settings = await getPlatformSettings();
  const adminRecipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `book_pub_${submission._id.toString()}`;

  const rows = [
    { label: "Book Title", value: submission.title },
    { label: "Author / Pen Name", value: submission.penName },
    { label: "Selling Price", value: `₹${bookPrice}` },
    { label: "Published Date", value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { label: "Public Store URL", value: `${baseUrl}/product/${productSlug}` },
  ];

  const buttons = [
    { label: "View Live Product", url: `${baseUrl}/product/${productSlug}`, isPrimary: true },
    { label: "Author Profile", url: `${baseUrl}/author/${submission.authorId?.toString()}` },
  ];

  const html = renderEmailTemplate({
    headline: `Book Published: ${submission.title}`,
    badgeText: "🎉 Book Live on Store",
    badgeBg: "#dcfce7",
    badgeColor: "#15803d",
    intro: "The book is now live in the Veeer Sukhadiya Books catalogue and available for purchase worldwide.",
    rows,
    buttons,
  });

  // Notify admin
  await sendIdempotentEmail({
    eventId,
    eventType: "BOOK_PUBLISHED",
    recipient: adminRecipient,
    subject: `🎉 Book Published | ${submission.title}`,
    html,
    text: `Book Published: "${submission.title}" by ${submission.penName}. Live at ${baseUrl}/product/${productSlug}`,
    authorId: submission.authorId,
    submissionId: submission._id,
  });

  // Notify author
  if (authorEmail) {
    const authorEventId = `author_book_pub_${submission._id.toString()}`;
    const authorHtml = renderEmailTemplate({
      headline: `Congratulations! "${submission.title}" is Live on Veeer Sukhadiya Books`,
      badgeText: "🚀 Book Published",
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
      intro: "Your book has been formatted, verified, and officially published on Veeer Sukhadiya Books! Readers can now purchase and read your book instantly in their browser.",
      rows: [
        { label: "Book Title", value: submission.title },
        { label: "Selling Price", value: `₹${bookPrice}` },
        { label: "Product Page", value: `${baseUrl}/product/${productSlug}` },
      ],
      buttons: [
        { label: "View Your Book on Store", url: `${baseUrl}/product/${productSlug}`, isPrimary: true },
        { label: "Open Author Dashboard", url: `${baseUrl}/author/dashboard` },
      ],
    });

    await sendIdempotentEmail({
      eventId: authorEventId,
      eventType: "AUTHOR_BOOK_PUBLISHED",
      recipient: authorEmail,
      subject: `🚀 Your Book "${submission.title}" is Now Live! | Veeer Sukhadiya Books`,
      html: authorHtml,
      text: `Your book "${submission.title}" is now live on Veeer Sukhadiya Books! View it at: ${baseUrl}/product/${productSlug}`,
      authorId: submission.authorId,
      submissionId: submission._id,
    });
  }
}

/** Event H: New External Book Sale (Triggered after verified checkout) */
export async function notifyNewBookSale({
  bookTitle,
  authorName,
  orderId,
  paymentId,
  grossAmount,
  platformCommission,
  authorShare,
  authorEmail,
}: {
  bookTitle: string;
  authorName: string;
  orderId: string;
  paymentId: string;
  grossAmount: number;
  platformCommission: number;
  authorShare: number;
  authorEmail?: string;
}) {
  const settings = await getPlatformSettings();
  const adminRecipient = settings.adminNotificationEmail || process.env.EMAIL_USER || "veeersukhadiyabooks95@gmail.com";
  const baseUrl = getBaseUrl();
  const eventId = `sale_${orderId}_${paymentId}`;

  const rows = [
    { label: "Book Purchased", value: bookTitle },
    { label: "Author", value: authorName },
    { label: "Order ID", value: orderId },
    { label: "Razorpay Payment ID", value: paymentId },
    { label: "Gross Sale Amount", value: `₹${grossAmount.toFixed(2)}` },
    { label: "Platform Commission", value: `₹${platformCommission.toFixed(2)}` },
    { label: "Author Net Share", value: `₹${authorShare.toFixed(2)}` },
    { label: "Sale Timestamp", value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
  ];

  const buttons = [
    { label: "View Marketplace Sales", url: `${baseUrl}/admin/publishing/sales`, isPrimary: true },
  ];

  const html = renderEmailTemplate({
    headline: `New External Book Sale: ${bookTitle}`,
    badgeText: "💰 Verified Sale",
    badgeBg: "#dcfce7",
    badgeColor: "#15803d",
    intro: "A verified sale has occurred for an external author book on Veeer Sukhadiya Books. Revenue ledger entry has been recorded.",
    rows,
    buttons,
  });

  // Send admin sale email
  await sendIdempotentEmail({
    eventId,
    eventType: "BOOK_SALE",
    recipient: adminRecipient,
    subject: `💰 New Book Sale | ${bookTitle}`,
    html,
    text: `New Book Sale: "${bookTitle}" for ₹${grossAmount.toFixed(2)}. Author Share: ₹${authorShare.toFixed(2)}. Order: ${orderId}.`,
  });

  // Send author sale email
  if (authorEmail) {
    const authorEventId = `author_sale_${orderId}_${paymentId}`;
    const authorHtml = renderEmailTemplate({
      headline: `You Just Made a Sale! 🎉`,
      badgeText: "💰 New Sale",
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
      intro: `A reader just purchased your book "${bookTitle}". Your earnings have been credited to your author revenue ledger.`,
      rows: [
        { label: "Book", value: bookTitle },
        { label: "Gross Sale Price", value: `₹${grossAmount.toFixed(2)}` },
        { label: "Platform Fee", value: `₹${platformCommission.toFixed(2)}` },
        { label: "Your Earnings", value: `₹${authorShare.toFixed(2)}` },
        { label: "Date", value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
      ],
      buttons: [
        { label: "View Sales & Earnings", url: `${baseUrl}/author/dashboard`, isPrimary: true },
      ],
    });

    await sendIdempotentEmail({
      eventId: authorEventId,
      eventType: "AUTHOR_BOOK_SALE",
      recipient: authorEmail,
      subject: `💰 You made a sale for "${bookTitle}"! | Veeer Sukhadiya Books`,
      html: authorHtml,
      text: `You made a sale for "${bookTitle}"! Earnings: ₹${authorShare.toFixed(2)}. View your dashboard at ${baseUrl}/author/dashboard`,
    });
  }
}
