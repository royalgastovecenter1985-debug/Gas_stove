/** Pure helpers — safe in both server and client components. */

export const BUSINESS = 'Royal Gas Stove Center';

/** Vercel Blob address of admin uploads, set at build time in next.config.ts ('' = served by this server). */
export const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL || '';

/** Public URL for a stored path: "assets/…" → "/assets/…" (uploads → Blob when used); full URLs pass through. */
export function imgSrc(path: string | null | undefined): string {
  const p = path || 'assets/img/placeholder.svg';
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^\/+/, '');
  if (UPLOADS_URL && clean.startsWith('assets/uploads/')) return `${UPLOADS_URL}/${clean}`;
  return '/' + clean;
}

export function telLink(phone: string): string {
  return 'tel:' + phone.replace(/[^\d+]/g, '');
}

export function waNumber(raw: string | undefined): string {
  return (raw || '').replace(/\D/g, '');
}

export function waLink(number: string, message = ''): string {
  return `https://wa.me/${waNumber(number)}${message ? '?text=' + encodeURIComponent(message) : ''}`;
}

export function waProductMessage(productName: string): string {
  return `Hello ${BUSINESS}, I'm interested in "${productName}". Please share price and details.`;
}

export function slugify(text: string): string {
  const s = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'item-' + Math.random().toString(16).slice(2, 8);
}

export function excerpt(text: string | null | undefined, len = 140): string {
  const t = String(text ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return t.length > len ? t.slice(0, len).trimEnd() + '…' : t;
}

export function paragraphs(text: string | null | undefined): string[] {
  return String(text ?? '').trim().split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
}

export function instagramShortcode(url: string | null | undefined): string | null {
  const m = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})/.exec(String(url ?? ''));
  return m ? m[1] : null;
}

export function instagramCleanUrl(url: string | null | undefined): string | null {
  const code = instagramShortcode(url);
  return code ? `https://www.instagram.com/reel/${code}/` : null;
}

export const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'closed'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const PHONE_RE = /^\+?[\d\s\-()]{10,18}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
