/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  // Add basePath if your app is not deployed at the root
  // basePath: '/your-base-path',
  
  // Add assetPrefix for CDN support
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://gpt-clone-pxtt.vercel.app' : '',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "images.unsplash.com",
      "oaidalleapiprodscus.blob.core.windows.net",
      "res.cloudinary.com",
    ],
    // Add unoptimized: true if you're using next/image with external URLs
    unoptimized: true,
  },
  env: {
    MEM0_API_KEY: process.env.MEM0_API_KEY,
  },
  // Add this to handle static file serving
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  // Add this to handle static file serving
  async rewrites() {
    return [
      {
        source: '/_next/static/:path*',
        destination: '/_next/static/:path*',
      },
      {
        source: '/static/:path*',
        destination: '/static/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
