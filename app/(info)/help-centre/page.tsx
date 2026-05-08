import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Help Centre | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Help Centre"
      intro="Quick answers for purchases, access, and reading support."
      cards={[
        {
          heading: "Accessing Your Books",
          body: "Sign in to your account and open \"My Library\" to access purchased titles instantly.",
        },
        {
          heading: "Payment Issues",
          body: "If a payment fails, wait a few minutes and retry. Contact us if the issue continues.",
        },
        {
          heading: "Technical Support",
          body: <>Email <strong>veeersukhadiyabooks95@gmail.com</strong> with your order details and issue description.</>,
        },
      ]}
    />
  );
}
