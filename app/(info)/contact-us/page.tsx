import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Contact Us | Veeer Sukhadiya Books" };

export default function Page() {
  return (
    <PolicyPage
      title="Contact Us"
      intro="We are here to help with reading, orders, and support queries."
      cards={[
        { heading: "Email", body: <strong>veeersukhadiyabooks95@gmail.com</strong> },
        { heading: "WhatsApp", body: <strong>+91-6351440242</strong> },
        { heading: "Location", body: "Gujarat, India" },
      ]}
    />
  );
}
