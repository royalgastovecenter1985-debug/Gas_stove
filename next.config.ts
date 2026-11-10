import type { NextConfig } from 'next';

// Admin uploads go to Vercel Blob when its token is present (Vercel has no permanent disk).
// The store's public address is derived from the token's store id; it is not secret (it is in every file URL).
const blobStore = /^vercel_blob_rw_([a-z0-9]+)_/i.exec(process.env.BLOB_READ_WRITE_TOKEN || '')?.[1];
const UPLOADS_URL = (process.env.UPLOADS_PUBLIC_URL || (blobStore ? `https://${blobStore.toLowerCase()}.public.blob.vercel-storage.com` : '')).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_UPLOADS_URL: UPLOADS_URL },
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
