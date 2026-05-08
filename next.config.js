/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large static files (book reader HTML files contain base64 images up to ~22MB)
  images: {
    remotePatterns: [],
  },
  // Disable telemetry collection during build
  experimental: {},
};

module.exports = nextConfig;
