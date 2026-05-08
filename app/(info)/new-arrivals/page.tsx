import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "New Arrivals | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="New Arrivals"
      intro="Fresh digital releases added for curious and ambitious readers."
      cards={[
        {
          heading: "Latest Releases",
          body: "Explore newly published titles in fiction, self-help, and student-focused learning books.",
        },
        {
          heading: "Stay Updated",
          body: "Check back regularly to discover new launches and limited introductory pricing.",
        },
      ]}
      ctaText="Explore Now"
    />
  );
}
