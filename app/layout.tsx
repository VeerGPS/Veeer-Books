import type { Metadata, Viewport } from "next";
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

      </body>
    </html>
  );
}
