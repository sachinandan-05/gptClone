import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };
    return config;
  },
  poweredByHeader: false,
  env: {
    MEM0_API_KEY: process.env.MEM0_API_KEY,
  },
};

export default nextConfig;
