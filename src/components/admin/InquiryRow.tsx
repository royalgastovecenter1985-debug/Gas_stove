import { deleteInquiry, setInquiryStatus } from '@/app/admin/actions/content';
import { Icon } from '@/components/Icon';
import { INQUIRY_STATUSES, telLink, waLink } from '@/lib/format';
import { AutoSubmitSelect, ConfirmButton } from './ui';

export interface InquiryRowData {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  product: string | null;
  message: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-10 17:03:00" (already India time, see lib/db.ts) → "10 Nov 2026, 5:03 PM". */
export function formatDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(d));
  if (!m) return String(d);
  const h = +m[4];
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}, ${h % 12 || 12}:${m[5]} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Reply to a customer on WhatsApp with their inquiry quoted. */
function replyLink(r: InquiryRowData, business: string): string {
  const digits = r.phone.replace(/\D/g, '');
  const num = digits.length === 10 ? '91' + digits : digits;
  return waLink(num, `Hello ${r.name}, thank you for your inquiry${r.product ? ` about ${r.product}` : ''} — ${business}.`);
}

export function InquiryRow({ r, back, business, compact = false }: { r: InquiryRowData; back: string; business: string; compact?: boolean }) {
  return (
    <tr>
      <td className="nowrap small">{formatDate(r.created_at)}<br /><span className="muted">{r.source}</span></td>
      <td>
        <strong>{r.name}</strong>
        <div className="small"><a href={telLink(r.phone)}>{r.phone}</a></div>
        {r.email && <div className="small"><a href={`mailto:${r.email}`}>{r.email}</a></div>}
        {r.city && <div className="small muted">{r.city}</div>}
      </td>
      <td>{r.product || <span className="muted">—</span>}</td>
      {!compact && <td className="msg">{r.message ? <span style={{ whiteSpace: 'pre-line' }}>{r.message}</span> : <span className="muted">—</span>}</td>}
      <td>
        <form action={setInquiryStatus}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="back" value={back} />
          <AutoSubmitSelect name="status" defaultValue={r.status} options={[...INQUIRY_STATUSES]} className={`status-select status--${r.status}`} />
        </form>
      </td>
      <td className="right nowrap">
        <a className="btn btn--outline btn--sm" href={replyLink(r, business)} target="_blank" rel="noopener" title="Reply on WhatsApp"><Icon name="whatsapp" size={14} /></a>{' '}
        <a className="btn btn--outline btn--sm" href={telLink(r.phone)} title="Call"><Icon name="phone" size={14} /></a>{' '}
        {!compact && (
          <form action={deleteInquiry} className="inline">
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="back" value={back} />
            <ConfirmButton message={`Delete the inquiry from ${r.name}?`} className="btn btn--danger btn--sm" title="Delete"><Icon name="trash" size={14} /></ConfirmButton>
          </form>
        )}
      </td>
    </tr>
  );
}
