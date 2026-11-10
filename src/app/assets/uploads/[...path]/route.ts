import fs from 'node:fs';
import type { NextRequest } from 'next/server';
import { diskPath } from '@/lib/paths';
import { fileResponse, MIME } from '@/lib/serve-file';

/**
 * Serves admin uploads from UPLOAD_DIR at /assets/uploads/… (the same URLs the PHP site used).
 * Uploads live outside /public because Next.js only serves files that exist there at build time.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const rel = (await ctx.params).path.join('/');
  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  const full = diskPath(`assets/uploads/${rel}`);
  if (!MIME[ext] || ext === 'svg' || !full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new Response('Not found', { status: 404 });
  }
  // File names are random and never reused, so they can be cached for a long time.
  return fileResponse(full, req.headers.get('range'), { 'Cache-Control': 'public, max-age=31536000, immutable' });
}
