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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["images.unsplash.com", "oaidalleapiprodscus.blob.core.windows.net", "res.cloudinary.com"],
  },
  env: {
    MEM0_API_KEY: process.env.MEM0_API_KEY,
  },
};

export default nextConfig;
