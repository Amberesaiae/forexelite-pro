import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev server access from network
  experimental: {
    allowedDevOrigins: ['192.168.1.108', 'localhost'],
  },
};

export default nextConfig;
