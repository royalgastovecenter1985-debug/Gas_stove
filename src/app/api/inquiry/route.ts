import { NextResponse, type NextRequest } from 'next/server';
import { waLink } from '@/lib/format';
import { inquiryWhatsAppText, processInquiry, type InquiryInput } from '@/lib/inquiries';
import { getSettings } from '@/lib/settings';

// Max 5 inquiries per 10 minutes per IP (in memory; resets when the server restarts).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - 600_000);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length >= 5;
}

/**
 * POST /api/inquiry — JSON from the site's form, or a plain form post when JavaScript is off
 * (then the visitor is redirected to WhatsApp with the details).
 */
export async function POST(req: NextRequest) {
  const isJson = (req.headers.get('content-type') || '').includes('application/json');
  let body: Record<string, string> = {};
  try {
    body = isJson ? await req.json() : (Object.fromEntries((await req.formData()).entries()) as Record<string, string>);
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 });
  }
  const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

  // Honeypot / too-fast submissions: pretend success so bots don't retry.
  const ts = Number(body.ts || 0);
  if (body.website || (ts > 0 && Date.now() / 1000 - ts < 3)) {
    return reply({ ok: true, message: 'Thank you! We will contact you shortly.' });
  }

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '0.0.0.0').trim().slice(0, 45);
  const s = await getSettings();
  if (rateLimited(ip)) {
    return reply({ ok: false, message: `Too many submissions. Please call us directly at ${s.phone_1}.`, errors: {} }, 429);
  }

  const input: InquiryInput = {
    name: body.name, phone: body.phone, email: body.email, city: body.city, product: body.product, message: body.message, source: body.source,
  };
  const result = await processInquiry(input, { ip, ua: (req.headers.get('user-agent') || '').slice(0, 255) });
  if (result.ok) hits.get(ip)!.push(Date.now());

  if (isJson) return reply(result, result.ok ? 200 : 422);
  if (!result.ok) return NextResponse.redirect(new URL('/contact#inquiry', req.url), 303);
  return NextResponse.redirect(waLink(s.whatsapp, inquiryWhatsAppText(input)), 303);
}
