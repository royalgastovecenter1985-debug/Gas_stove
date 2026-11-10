import fs from 'node:fs';
import { NextResponse, type NextRequest } from 'next/server';
import { diskPath } from '@/lib/paths';
import { fileResponse } from '@/lib/serve-file';
import { getSettings } from '@/lib/settings';

/** GET /brochure — downloads the brochure PDF uploaded in Admin → Settings. */
export async function GET(req: NextRequest) {
  const s = await getSettings();
  const full = s.brochure_file?.toLowerCase().endsWith('.pdf') ? diskPath(s.brochure_file) : null;
  if (!full || !fs.existsSync(full)) {
    return NextResponse.redirect(new URL('/contact#inquiry', req.url));
  }
  const name = `${(s.site_name || 'Brochure').replace(/[^A-Za-z0-9]+/g, '-')}-Brochure.pdf`;
  return fileResponse(full, null, {
    'Content-Disposition': `attachment; filename="${name}"`,
    'Cache-Control': 'public, max-age=3600',
  });
}
