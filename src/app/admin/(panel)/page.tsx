import Link from 'next/link';
import { InquiryRow, type InquiryRowData } from '@/components/admin/InquiryRow';
import { requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  await requireAdmin();
  const [c, latest, s] = await Promise.all([
    queryOne<Record<string, number>>(`SELECT
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM certificates) AS certificates,
      (SELECT COUNT(*) FROM inquiries WHERE status = 'new') AS new_inquiries,
      (SELECT COUNT(*) FROM inquiries WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS week_inquiries`),
    query<InquiryRowData>('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 8'),
    getSettings(),
  ]);
  const n = (k: string) => Number(c?.[k] ?? 0);

  return (
    <>
      <div className="stat-cards">
        <Link href="/admin/inquiries?status=new" className="stat-card stat-card--gold"><span>New inquiries</span><strong>{n('new_inquiries')}</strong></Link>
        <Link href="/admin/inquiries" className="stat-card"><span>Inquiries (7 days)</span><strong>{n('week_inquiries')}</strong></Link>
        <Link href="/admin/products" className="stat-card"><span>Products</span><strong>{n('products')}</strong></Link>
        <Link href="/admin/categories" className="stat-card"><span>Categories</span><strong>{n('categories')}</strong></Link>
        <Link href="/admin/certificates" className="stat-card"><span>Certificates</span><strong>{n('certificates')}</strong></Link>
      </div>

      <div className="quick-actions">
        <Link href="/admin/products/new" className="btn btn--gold">+ Add product</Link>
        <Link href="/admin/certificates" className="btn btn--outline">+ Add certificate</Link>
        <Link href="/admin/about" className="btn btn--outline">Edit About page</Link>
        <Link href="/admin/settings" className="btn btn--outline">Logo, phones &amp; address</Link>
        <a href="/admin/inquiries/export" className="btn btn--outline">Export inquiries (CSV)</a>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2>Latest inquiries</h2>
          <Link href="/admin/inquiries">View all →</Link>
        </div>
        {latest.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Status</th><th className="right">Reply</th></tr></thead>
              <tbody>{latest.map((r) => <InquiryRow key={r.id} r={r} back="/admin/inquiries" business={s.site_name} compact />)}</tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No inquiries yet. They appear here as soon as a visitor sends the form on the website.</p>
        )}
      </section>
    </>
  );
}
