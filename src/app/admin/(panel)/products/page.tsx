import Link from 'next/link';
import { deleteProduct, toggleProduct } from '@/app/admin/actions/products';
import { Flash, spStr, type SP } from '@/components/admin/Flash';
import { ConfirmButton } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';
import { requireAdmin } from '@/lib/auth';
import { likeTerm, parseJson, query, queryOne } from '@/lib/db';
import { smallOf } from '@/lib/picture';

export const metadata = { title: 'Products' };

const PER_PAGE = 30;

export default async function ProductsAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = spStr(sp, 'q').slice(0, 80);
  const cat = parseInt(spStr(sp, 'cat'), 10) || 0;
  const page = Math.max(1, parseInt(spStr(sp, 'page'), 10) || 1);

  const where: string[] = [];
  const args: unknown[] = [];
  if (q) { where.push('(p.name LIKE ? OR p.slug LIKE ?)'); args.push(likeTerm(q), likeTerm(q)); }
  if (cat) { where.push('p.category_id = ?'); args.push(cat); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [cats, total, rows] = await Promise.all([
    query<{ id: number; name: string }>('SELECT id, name FROM categories ORDER BY sort_order, name'),
    queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM products p ${w}`, args),
    query<{ id: number; name: string; slug: string; images: unknown; is_featured: number; is_active: number; sort_order: number; category_name: string }>(
      `SELECT p.id, p.name, p.slug, p.images, p.is_featured, p.is_active, p.sort_order, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id ${w}
       ORDER BY c.sort_order, p.sort_order, p.name LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`, args),
  ]);
  const count = Number(total?.n ?? 0);
  const pages = Math.max(1, Math.ceil(count / PER_PAGE));
  const qs = (p: number) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(cat && { cat: String(cat) }), ...(p > 1 && { page: String(p) }) })}`;
  const back = qs(page);

  const toggle = (id: number, field: 'is_featured' | 'is_active', on: boolean, label: string) => (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="back" value={back} />
      <button className={`toggle${on ? ' is-on' : ''}`} aria-label={label} aria-pressed={on} title={label}><span /></button>
    </form>
  );

  return (
    <>
      <Flash sp={sp} />
      <div className="toolbar">
        <form className="filters" method="get">
          <input type="search" name="q" defaultValue={q} placeholder="Search products…" />
          <select name="cat" defaultValue={cat || ''}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn--outline btn--sm">Filter</button>
          {(q || cat) ? <Link href="/admin/products" className="btn btn--ghost btn--sm">Clear</Link> : null}
        </form>
        <Link href="/admin/products/new" className="btn btn--gold">+ Add product</Link>
      </div>

      <section className="panel">
        <p className="muted small">{count} product{count === 1 ? '' : 's'}</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th /><th>Product</th><th>Category</th><th>Photos</th><th>Featured</th><th>Visible</th><th>Order</th><th className="right">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const imgs = parseJson<string[]>(p.images, []);
                return (
                  <tr key={p.id} className={p.is_active ? '' : 'is-muted'}>
                    <td><img className="thumb" src={smallOf(imgs[0])} alt="" loading="lazy" /></td>
                    <td><Link href={`/admin/products/${p.id}`}><strong>{p.name}</strong></Link><div className="small muted">/product/{p.slug}</div></td>
                    <td>{p.category_name}</td>
                    <td>{imgs.length}</td>
                    <td>{toggle(p.id, 'is_featured', !!p.is_featured, 'Featured on home page')}</td>
                    <td>{toggle(p.id, 'is_active', !!p.is_active, 'Visible on website')}</td>
                    <td>{p.sort_order}</td>
                    <td className="right nowrap">
                      <a className="btn btn--ghost btn--sm" href={`/product/${p.slug}`} target="_blank" rel="noopener" title="View on website"><Icon name="eye" size={14} /></a>{' '}
                      <Link className="btn btn--outline btn--sm" href={`/admin/products/${p.id}`}><Icon name="edit" size={14} /> Edit</Link>{' '}
                      <form action={deleteProduct} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton message={`Delete “${p.name}” and its photos? This cannot be undone.`} className="btn btn--danger btn--sm" title="Delete"><Icon name="trash" size={14} /></ConfirmButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={8} className="muted center">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <nav className="pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={qs(p)} className={p === page ? 'is-active' : ''}>{p}</Link>
            ))}
          </nav>
        )}
      </section>
    </>
  );
}
