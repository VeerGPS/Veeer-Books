import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Terms of Service | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="📜 Terms of Service"
      intro="Simple rules for a smooth and fair reading experience."
      cards={[
        {
          heading: "📚 Usage Rights",
          body: "All ebooks are for personal use only. Redistribution or resale is strictly prohibited.",
        },
        {
          heading: "💳 Payments",
          body: "All payments are final. No refunds once the ebook is accessed or downloaded.",
        },
        {
          heading: "🔐 Account Responsibility",
          body: "You are responsible for maintaining the security of your account.",
        },
        {
          heading: "⚠️ Violations",
          body: "Violation of terms may result in account suspension without notice.",
        },
      ]}
      ctaText="← Back to Home"
    />
  );
}
