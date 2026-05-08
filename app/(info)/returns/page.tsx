import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Returns | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Returns"
      intro="Our digital-book return policy is simple and transparent."
      cards={[
        {
          heading: "Digital Product Policy",
          body: "Since eBooks are delivered instantly, returns are generally not available after access is granted.",
        },
        {
          heading: "Exceptional Cases",
          body: "If a file is corrupted or inaccessible, contact support and we will help with a replacement or resolution.",
        },
        {
          heading: "Support Contact",
          body: <>Email us at <strong>veeersukhadiyabooks95@gmail.com</strong> with your order details.</>,
        },
      ]}
    />
  );
}
