import 'server-only';
import { headers } from 'next/headers';

/** Best-effort client IP (behind a proxy, the first X-Forwarded-For entry). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (fwd || h.get('x-real-ip') || '0.0.0.0').slice(0, 45);
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get('user-agent') || '').slice(0, 255);
}

/** Absolute site URL for canonical / Open Graph / sitemap links. */
export function siteUrl(path = ''): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return base + '/' + path.replace(/^\/+/, '');
}
