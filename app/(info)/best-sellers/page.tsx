import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Best Sellers | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Best Sellers"
      intro="Discover the books most loved by our readers."
      cards={[
        {
          heading: "Top Picks",
          body: "Our best sellers are selected based on reader purchases, reviews, and engagement trends.",
        },
        {
          heading: "Updated Regularly",
          body: "This list is refreshed often so you can always find trending and high-value reads.",
        },
      ]}
      ctaText="Browse Collection"
    />
  );
}
