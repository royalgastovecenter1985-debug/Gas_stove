import 'server-only';
import { execute } from './db';
import { BUSINESS, EMAIL_RE, PHONE_RE } from './format';
import { escapeHtml, sendMail } from './mail';
import { getSettings } from './settings';

export interface InquiryInput {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  product?: string;
  message?: string;
  source?: string;
}

export type InquiryResult = { ok: true; message: string } | { ok: false; message: string; errors: Record<string, string> };

/** Validate, save and (optionally) e-mail an inquiry. */
export async function processInquiry(input: InquiryInput, meta: { ip: string; ua: string }): Promise<InquiryResult> {
  const d = {
    name: String(input.name ?? '').trim(),
    phone: String(input.phone ?? '').trim(),
    email: String(input.email ?? '').trim(),
    city: String(input.city ?? '').trim().slice(0, 100),
    product: String(input.product ?? '').trim().slice(0, 200),
    message: String(input.message ?? '').trim(),
    source: String(input.source ?? 'website').replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'website',
  };
  const errors: Record<string, string> = {};
  if (d.name.length < 2 || d.name.length > 120) errors.name = 'Please enter your name.';
  if (!PHONE_RE.test(d.phone)) errors.phone = 'Please enter a valid 10-digit mobile number.';
  if (d.email && (!EMAIL_RE.test(d.email) || d.email.length > 160)) errors.email = 'Please enter a valid email address.';
  if (d.message.length > 2000) errors.message = 'Message is too long (max 2000 characters).';
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Please correct the highlighted fields.' };

  await execute(
    'INSERT INTO inquiries (name, phone, email, city, product, message, source, ip_address, user_agent) VALUES (?,?,?,?,?,?,?,?,?)',
    [d.name, d.phone, d.email || null, d.city || null, d.product || null, d.message, d.source, meta.ip, meta.ua],
  );

  const s = await getSettings();
  if (s.notify_email) {
    const rows = ([['Name', d.name], ['Phone', d.phone], ['Email', d.email], ['City', d.city], ['Product', d.product], ['Message', d.message]] as const)
      .map(([label, v]) => `<tr><td style="padding:6px 12px;color:#6B6B6B">${label}</td><td style="padding:6px 12px"><strong>${escapeHtml(v || '—').replace(/\n/g, '<br>')}</strong></td></tr>`)
      .join('');
    const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="color:#A07C10">New website inquiry</h2><table style="border-collapse:collapse">${rows}</table><p style="color:#6B6B6B;font-size:12px">Received ${when} via ${escapeHtml(d.source)}</p></div>`;
    void sendMail(s.notify_email, `New inquiry: ${d.product || 'General'} — ${d.name}`, html, d.email || null);
  }
  return { ok: true, message: `Thank you, ${d.name}! Our team will call you back shortly.` };
}

/** WhatsApp text with every inquiry detail (used by the no-JavaScript fallback). */
export function inquiryWhatsAppText(d: InquiryInput): string {
  const lines = [`Hello ${BUSINESS}, I would like a quote.`, '', `*Name:* ${d.name ?? ''}`, `*Mobile:* ${d.phone ?? ''}`];
  if (d.email) lines.push(`*Email:* ${d.email}`);
  if (d.city) lines.push(`*City:* ${d.city}`);
  if (d.product) lines.push(`*Product:* ${d.product}`);
  if (d.message) lines.push(`*Requirement:* ${d.message}`);
  return lines.join('\n');
}
