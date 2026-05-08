import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Privacy Policy | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="🔐 Privacy Policy"
      intro="Your data is treated like a rare book — protected, preserved, and never misused."
      cards={[
        {
          heading: "📌 Information We Collect",
          body: "We collect basic information such as your name, email, and purchase details to provide you with a smooth experience.",
        },
        {
          heading: "🛡️ How We Use Your Data",
          body: "Your data is used only for login, purchases, and improving your reading experience. We never sell or misuse your information.",
        },
        {
          heading: "🔒 Data Protection",
          body: "We use secure systems to protect your data from unauthorized access, leaks, or misuse.",
        },
        {
          heading: "🚫 Third-Party Sharing",
          body: "We do not share your personal data with third parties unless required by law.",
        },
        {
          heading: "📧 Contact",
          body: <>If you have any questions, contact us at: <strong>veeersukhadiyabooks95@gmail.com</strong></>,
        },
      ]}
      ctaText="← Back to Home"
    />
  );
}
