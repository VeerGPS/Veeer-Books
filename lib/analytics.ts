// Analytics tracking helper for author funnel and commercial marketplace events.
// Works seamlessly with Vercel Analytics and browser events.

export type AnalyticsEventName =
  | "publish_page_view"
  | "author_registration_started"
  | "author_registration_completed"
  | "book_submission_started"
  | "book_submission_completed"
  | "manuscript_uploaded"
  | "cover_uploaded"
  | "book_details_completed"
  | "submission_submitted"
  | "submission_changes_requested"
  | "submission_resubmitted"
  | "book_approved"
  | "book_published"
  | "external_book_view"
  | "external_book_preview"
  | "external_book_add_to_cart"
  | "external_book_checkout"
  | "external_book_purchase";

export function trackMarketplaceEvent(
  event: AnalyticsEventName,
  data?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  try {
    // Sanitized payload - never include private PII / KYC / financial keys
    const safeData: Record<string, string | number | boolean> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (!["password", "token", "accountNumber", "ifscCode", "upiId", "email", "phone"].includes(key)) {
          safeData[key] = value;
        }
      }
    }

    // Call window.va if @vercel/analytics is present
    const win = window as any;
    if (typeof win.va === "function") {
      win.va("event", { name: event, data: safeData });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[ANALYTICS] ${event}`, safeData);
    }
  } catch {
    /* ignore tracking failures */
  }
}
