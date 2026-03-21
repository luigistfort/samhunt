// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image domains (if using next/image with external sources)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub avatars
      },
    ],
  },

  // Server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Environment variable exposure (only NEXT_PUBLIC_ ones go to browser)
  // Never expose SAM_GOV_API_KEY or OPENAI_API_KEY here
  env: {
    NEXT_PUBLIC_AI_ENABLED: process.env.OPENAI_API_KEY ? 'true' : 'false',
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Never cache API routes that call SAM.gov
      {
        source: '/api/opportunities/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/search',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
