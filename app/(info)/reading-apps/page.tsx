import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Reading Apps | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Reading Apps"
      intro="Read comfortably on desktop, tablet, or mobile with your preferred tools."
      cards={[
        {
          heading: "Supported Formats",
          body: "Our titles are delivered in easy-to-access formats designed for smooth digital reading.",
        },
        {
          heading: "Recommended Setup",
          body: "Use a modern browser for best performance, clear text rendering, and quick navigation.",
        },
        {
          heading: "Reading Tips",
          body: "Adjust font size, brightness, and theme mode to reduce eye strain during long sessions.",
        },
      ]}
      ctaText="Start Reading"
    />
  );
}
