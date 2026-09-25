/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // Covers are resized and served as AVIF/WebP (a 2.5 MB PNG becomes ~20–40 KB).
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 828, 1080, 1280, 1920],
    imageSizes: [36, 70, 80, 100, 160, 240, 320],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Book reader page images / thumbnails / search text never change for a given edition.
        source: "/readers/:slug/p/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/readers/:file(reader\\.js|reader\\.css)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/readers/:slug/thumbs.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/readers/:slug/text.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/images/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
    ];
  },
};

module.exports = nextConfig;
