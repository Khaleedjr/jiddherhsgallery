import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photography still lives on the existing WordPress media library.
    remotePatterns: [
      { protocol: "https", hostname: "jiddersgallery.com.ng", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "www.jiddersgallery.com.ng", pathname: "/wp-content/uploads/**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
  },
  poweredByHeader: false,
};

export default nextConfig;
