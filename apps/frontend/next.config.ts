import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },
  // Disable aggressive caching for HTML pages to prevent mobile cache issues
  async headers() {
    return [
      // Prevent caching of all HTML pages and API routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // Static assets can be cached but with versioning
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Prevent caching of HTML pages specifically
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Allow caching of favicon
      {
        source: '/logo-main.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*(favicon|icon|apple-touch-icon|android-chrome).:ext',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Generate unique build ID to force cache invalidation on each deployment
  // This helps browsers recognize new builds and clear old cached assets
  generateBuildId: async () => {
    // Use environment variable if set, otherwise use timestamp
    if (process.env.BUILD_ID) {
      return process.env.BUILD_ID;
    }
    // Fallback: timestamp-based ID (will be different each build)
    return `build-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
  },
};

export default nextConfig;
