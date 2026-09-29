import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/cart",
          "/library",
          "/reader/",
          "/author/dashboard",
          "/author/reports",
          "/author/promote",
          "/refer",
          "/gift/",
          "/author/payments",
          "/author/account",
          "/author/help",
          "/author/setup",
          "/author/publish",
          "/author/submissions",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
