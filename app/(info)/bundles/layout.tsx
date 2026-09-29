import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "eBook Bundles — Save on Collections",
  description: "Get curated eBook bundles from Veeer Sukhadiya Books at a discount. Read instantly on any device.",
  alternates: { canonical: "/bundles" },
};

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
