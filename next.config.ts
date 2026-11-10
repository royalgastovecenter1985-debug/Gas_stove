import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle in .next/standalone (see README → Deploying).
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['sharp', 'pg'],
  // Uploads and sources are read from disk at runtime; never copy them into the server bundle.
  // (public/ is copied by `npm run build` — see the postbuild script.)
  outputFileTracingExcludes: {
    '/*': ['./storage/**/*', './src/**/*', './public/**/*', './database/**/*', './.env*'],
  },
  // sharp's native library files sit next to its .node binary and are not detected automatically.
  outputFileTracingIncludes: {
    '/*': ['./node_modules/@img/**/*'],
  },
  experimental: {
    // Admin forms upload several product photos / a reel video in one request.
    serverActions: { bodySizeLimit: '60mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/assets/img/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
      },
    ];
  },
};

export default nextConfig;
