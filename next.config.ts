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
  /* The delivery page's old address, and the old WordPress site's policy and FAQ addresses, so shared links keep working. */
  async redirects() {
    return [
      { source: "/delivery-returns", destination: "/pickup-delivery", permanent: true },
      { source: "/pickup-and-delivery-policies", destination: "/pickup-delivery", permanent: true },
      { source: "/return-and-exchange-policy", destination: "/returns", permanent: true },
      { source: "/frequently-asked-questions", destination: "/faq", permanent: true },
    ];
  },
};

export default nextConfig;
