import fs from 'node:fs';
import { NextResponse, type NextRequest } from 'next/server';
import { imgSrc, UPLOADS_URL } from '@/lib/format';
import { diskPath, fileExists, UPLOAD_PREFIX } from '@/lib/paths';
import { fileResponse } from '@/lib/serve-file';
import { getSettings } from '@/lib/settings';

/** GET /brochure — downloads the brochure PDF uploaded in Admin → Settings. */
export async function GET(req: NextRequest) {
  const s = await getSettings();
  const stored = s.brochure_file?.toLowerCase().endsWith('.pdf') ? s.brochure_file : '';
  const contact = () => NextResponse.redirect(new URL('/contact#inquiry', req.url));
  if (!stored) return contact();

  // Uploaded brochure in Vercel Blob: let Blob send it as a download.
  if (UPLOADS_URL && stored.startsWith(UPLOAD_PREFIX)) {
    return NextResponse.redirect(`${imgSrc(stored)}?download=1`);
  }

  const full = diskPath(stored);
  if (full && fs.existsSync(full)) {
    const name = `${(s.site_name || 'Brochure').replace(/[^A-Za-z0-9]+/g, '-')}-Brochure.pdf`;
    return fileResponse(full, null, {
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'public, max-age=3600',
    });
  }
  // Bundled brochure in public/ (on Vercel it is served as a static file, not from disk).
  if (!stored.startsWith(UPLOAD_PREFIX) && fileExists(stored)) {
    return NextResponse.redirect(new URL(imgSrc(stored), req.url));
  }
  return contact();
}
