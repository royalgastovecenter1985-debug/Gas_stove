import 'server-only';
import nodemailer from 'nodemailer';

/** Send an HTML e-mail through SMTP (env SMTP_*). Never throws; returns false when not configured or on failure. */
export async function sendMail(to: string, subject: string, html: string, replyTo?: string | null): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) return false;
  try {
    const secure = (process.env.SMTP_SECURE || 'tls') === 'ssl';
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || (secure ? 465 : 587)),
      secure,
      requireTLS: process.env.SMTP_SECURE === 'tls',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
    });
    await transport.sendMail({
      from: { name: process.env.MAIL_FROM_NAME || 'Royal Gas Stove Center', address: process.env.MAIL_FROM || 'no-reply@localhost' },
      to,
      subject,
      html,
      replyTo: replyTo || undefined,
    });
    return true;
  } catch (e) {
    console.error('sendMail failed:', e);
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
