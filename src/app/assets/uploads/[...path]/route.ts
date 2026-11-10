import fs from 'node:fs';
import type { NextRequest } from 'next/server';
import { UPLOADS_URL } from '@/lib/format';
import { diskPath } from '@/lib/paths';
import { fileResponse, MIME } from '@/lib/serve-file';

/**
 * /assets/uploads/… (the same URLs the PHP site used).
 *  - Uploads in Vercel Blob: permanent redirect to the Blob file (pages already link to Blob directly).
 *  - Otherwise: served from UPLOAD_DIR, which lives outside /public because Next.js only serves
 *    files that exist there at build time.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const rel = (await ctx.params).path.join('/');
  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  if (!MIME[ext] || ext === 'svg' || rel.split('/').includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  if (UPLOADS_URL) {
    return new Response(null, {
      status: 308,
      headers: { Location: `${UPLOADS_URL}/assets/uploads/${rel}`, 'Cache-Control': 'public, max-age=86400' },
    });
  }
  const full = diskPath(`assets/uploads/${rel}`);
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new Response('Not found', { status: 404 });
  }
  // File names are random and never reused, so they can be cached for a long time.
  return fileResponse(full, req.headers.get('range'), { 'Cache-Control': 'public, max-age=31536000, immutable' });
}
