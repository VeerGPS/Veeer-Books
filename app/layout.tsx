import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HideOnReader from "@/components/HideOnReader";
import RefCapture from "@/components/RefCapture";
import GiftPopup from "@/components/GiftPopup";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Veeer Sukhadiya Books | eBooks, Readers & Self-Publishing",
    template: "%s | Veeer Sukhadiya Books",
  },
  description:
    "Read fiction, self-help and practical eBooks in a beautiful web reader on any device — or publish your own book and keep 85% of every sale.",
  applicationName: SITE_NAME,
  keywords: ["eBooks India", "buy eBooks online", "self-help books", "fiction eBooks", "self-publishing India", "publish your book", "Veeer Sukhadiya"],
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: SITE_URL,
    title: "Veeer Sukhadiya Books",
    description: "Read beautiful eBooks on any device — or publish your own and keep 85% of every sale.",
    images: [{ url: "/images/logo.png", alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`,
      email: "veeersukhadiyabooks95@gmail.com",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "en-IN",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fdfbf7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ORG_LD)} />
        {/* Hide INR prices for a moment on US/UK visits until they switch to $ / £ (no flash of rupees). */}
        <script dangerouslySetInnerHTML={{ __html: `try{var m=document.cookie.match(/(?:^|; )vsb_cur=([A-Z]{3})/);document.documentElement.setAttribute('data-cur',m?m[1]:'INR')}catch(e){}` }} />
        <Providers>
          <RefCapture />
          <GiftPopup />
          <Header />
          <main id="main-content">{children}</main>
          <HideOnReader>
            <Footer />
          </HideOnReader>
        </Providers>
        {process.env.VERCEL === "1" && <Analytics />}

      </body>
    </html>
  );
}
