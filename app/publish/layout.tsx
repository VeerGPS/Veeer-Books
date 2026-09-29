import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publish Your eBook — Keep 85% Royalties",
  description:
    "Self-publish your eBook on Veeer Sukhadiya Books. Free to publish, keep 85% of every sale, keep your rights, get paid on the last day of every month, and track sales live.",
  alternates: { canonical: "/publish" },
  openGraph: {
    url: "/publish",
    title: "Publish your book on Veeer Sukhadiya Books",
    description: "Free to publish. Keep 85% of every sale. Paid on the last day of every month.",
  },
};

export default function PublishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
