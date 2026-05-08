import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Cookie Policy | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="🍪 Cookie Policy"
      intro="Small cookies, big improvements in your reading journey."
      cards={[
        {
          heading: "📌 What Are Cookies?",
          body: "Cookies are small data files stored on your device to improve your browsing experience.",
        },
        {
          heading: "⚙️ How We Use Cookies",
          body: "We use cookies to manage login sessions, remember preferences, and improve performance.",
        },
        {
          heading: "🚫 No Harmful Tracking",
          body: "We do not use cookies for intrusive tracking or advertising.",
        },
        {
          heading: "🔧 Control",
          body: "You can disable cookies anytime through your browser settings.",
        },
      ]}
      ctaText="← Back to Home"
    />
  );
}
