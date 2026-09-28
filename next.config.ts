import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // payment proofs and ticket attachments are up to 5 MB (+ form overhead)
    serverActions: { bodySizeLimit: "6mb" },
  },
  // files served from the database must never be guessed into HTML/JS by the browser
  async headers() {
    return [{ source: "/api/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] }];
  },
};

export default nextConfig;
