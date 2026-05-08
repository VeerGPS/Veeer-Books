import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Gift Cards | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Gift Cards"
      intro="Share the joy of reading with flexible digital gift options."
      cards={[
        {
          heading: "How It Works",
          body: "Choose an amount, add the recipient details, and send your gift card instantly by email.",
        },
        {
          heading: "Validity",
          body: "Gift cards are valid for 12 months from the date of purchase and can be used across eligible titles.",
        },
        {
          heading: "Need Help?",
          body: <>For gift card support, write to <strong>veeersukhadiyabooks95@gmail.com</strong>.</>,
        },
      ]}
    />
  );
}
