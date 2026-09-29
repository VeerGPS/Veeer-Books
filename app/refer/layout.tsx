import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn",
  description: "Share Veeer Sukhadiya Books with friends: they get 10% off their first book and you earn 15% off coupons.",
  robots: { index: false },
};

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
