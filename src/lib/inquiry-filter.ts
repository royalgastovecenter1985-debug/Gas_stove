import 'server-only';
import { likeTerm } from './db';
import { INQUIRY_STATUSES } from './format';

/** WHERE clause for the admin inquiries list and its CSV export (same filters). */
export function inquiryFilter(statusRaw: string, qRaw: string) {
  const status = (INQUIRY_STATUSES as readonly string[]).includes(statusRaw) ? statusRaw : '';
  const q = qRaw.trim().slice(0, 80);
  const where: string[] = [];
  const args: unknown[] = [];
  if (status) { where.push('status = ?'); args.push(status); }
  if (q) {
    where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR product LIKE ? OR city LIKE ? OR message LIKE ?)');
    const like = likeTerm(q);
    args.push(like, like, like, like, like, like);
  }
  return { status, q, sql: where.length ? ' WHERE ' + where.join(' AND ') : '', args };
}
