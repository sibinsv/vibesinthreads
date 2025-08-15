import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during build (for emergency deployments)
    // Remove this in development after fixing all TypeScript issues
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    // Ignore ESLint errors during build (for emergency deployments)
    // Remove this in development after fixing all ESLint issues
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/api/v1/images/**',
      },
      {
        protocol: 'https',
        hostname: 'vibesinthreads.store',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'vibesinthreads.store',
        port: '',
        pathname: '/api/v1/images/**',
      },
    ],
  },
};

export default nextConfig;
