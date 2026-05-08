import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veeer Sukhadiya Books | A Complete eBook Store",
  description:
    "Welcome to Veeer Sukhadiya Books — a digital publishing platform where readers can explore engaging fiction eBooks, story books, and creative works.",
  icons: { icon: "/images/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </Providers>

        {/* Razorpay Checkout — same script tag as the original index.html */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
