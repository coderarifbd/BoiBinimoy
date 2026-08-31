import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local and LAN/network host access in Next.js development
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.56.1",
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
