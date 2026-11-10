import Link from 'next/link';
import { Flash, spStr, type SP } from '@/components/admin/Flash';
import { InquiryRow, type InquiryRowData } from '@/components/admin/InquiryRow';
import { requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { INQUIRY_STATUSES } from '@/lib/format';
import { inquiryFilter } from '@/lib/inquiry-filter';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Inquiries' };

const PER_PAGE = 25;

export default async function InquiriesAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const f = inquiryFilter(spStr(sp, 'status'), spStr(sp, 'q'));
  const page = Math.max(1, parseInt(spStr(sp, 'page'), 10) || 1);

  const [counts, totalRow, rows, s] = await Promise.all([
    query<{ status: string; n: number }>('SELECT status, COUNT(*) AS n FROM inquiries GROUP BY status'),
    queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM inquiries${f.sql}`, f.args),
    query<InquiryRowData>(
      `SELECT * FROM inquiries${f.sql} ORDER BY created_at DESC, id DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`,
      f.args,
    ),
    getSettings(),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, Number(c.n)]));
  const all = counts.reduce((a, c) => a + Number(c.n), 0);
  const total = Number(totalRow?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (o: { status?: string; page?: number }) => {
    const p = new URLSearchParams();
    const st = o.status ?? f.status;
    if (st) p.set('status', st);
    if (f.q) p.set('q', f.q);
    if (o.page && o.page > 1) p.set('page', String(o.page));
    const str = p.toString();
    return '/admin/inquiries' + (str ? '?' + str : '');
  };
  const back = qs({ page });
  const exportHref = '/admin/inquiries/export' + (qs({}).split('?')[1] ? '?' + qs({}).split('?')[1] : '');

  return (
    <>
      <Flash sp={sp} />
      <div className="tabs-row">
        <Link href={qs({ status: '' })} className={`chip${!f.status ? ' is-active' : ''}`}>All <b>{all}</b></Link>
        {INQUIRY_STATUSES.map((st) => (
          <Link key={st} href={qs({ status: st })} className={`chip chip--${st}${f.status === st ? ' is-active' : ''}`}>{st[0].toUpperCase() + st.slice(1)} <b>{byStatus[st] ?? 0}</b></Link>
        ))}
      </div>
      <div className="toolbar">
        <form className="filters" method="get">
          {f.status && <input type="hidden" name="status" value={f.status} />}
          <input type="search" name="q" defaultValue={f.q} placeholder="Name, phone, product, city…" />
          <button className="btn btn--outline btn--sm">Search</button>
          {f.q && <Link href={qs({ status: f.status })} className="btn btn--ghost btn--sm">Clear</Link>}
        </form>
        <a className="btn btn--gold" href={exportHref}>Export CSV</a>
      </div>

      <section className="panel">
        <p className="muted small">{total} inquir{total === 1 ? 'y' : 'ies'} · every website form submission is saved here, and the customer is also sent to your WhatsApp.</p>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Requirement</th><th>Status</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => <InquiryRow key={r.id} r={r} back={back} business={s.site_name} />)}
              {!rows.length && <tr><td colSpan={6} className="muted center">No inquiries found.</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <nav className="pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={qs({ page: p })} className={p === page ? 'is-active' : ''}>{p}</Link>
            ))}
          </nav>
        )}
      </section>
    </>
  );
}
