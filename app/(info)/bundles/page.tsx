import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Bundles | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Bundles"
      intro="Get more value with hand-picked multi-book collections."
      cards={[
        {
          heading: "Why Bundles?",
          body: "Bundles combine related titles at a better price than buying books individually.",
        },
        {
          heading: "Who Are They For?",
          body: "Perfect for readers who want complete learning paths or themed story sets.",
        },
      ]}
      ctaText="View Store"
    />
  );
}
