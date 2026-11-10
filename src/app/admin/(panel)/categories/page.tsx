import Link from 'next/link';
import { deleteCategory, saveCategory } from '@/app/admin/actions/content';
import { Flash, spStr, type SP } from '@/components/admin/Flash';
import { ToggleActive } from '@/components/admin/ToggleActive';
import { ActionForm, ConfirmButton, ImageInput } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { smallOf } from '@/lib/picture';

export const metadata = { title: 'Categories' };

interface Row {
  id: number; name: string; slug: string; tagline: string | null; description: string | null; image: string | null;
  sort_order: number; is_active: number; n: number;
}

export default async function CategoriesAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await query<Row>(
    'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS n FROM categories c ORDER BY c.sort_order, c.name',
  );
  const editId = parseInt(spStr(sp, 'edit'), 10) || 0;
  const editing = rows.find((r) => r.id === editId) ?? null;

  return (
    <>
      <Flash sp={sp} />
      <div className="form-layout">
        <section className="panel">
          <div className="panel__head"><h2>All categories</h2><span className="muted small">{rows.length}</span></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th /><th>Category</th><th>Products</th><th>Visible</th><th>Order</th><th className="right">Actions</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={c.id === editId ? 'is-selected' : c.is_active ? '' : 'is-muted'}>
                    <td><img className="thumb" src={smallOf(c.image)} alt="" loading="lazy" /></td>
                    <td><strong>{c.name}</strong><div className="small muted">/products/{c.slug}</div></td>
                    <td><Link href={`/admin/products?cat=${c.id}`}>{Number(c.n)}</Link></td>
                    <td><ToggleActive table="categories" id={c.id} on={!!c.is_active} /></td>
                    <td>{c.sort_order}</td>
                    <td className="right nowrap">
                      <Link className="btn btn--outline btn--sm" href={`/admin/categories?edit=${c.id}`}><Icon name="edit" size={14} /> Edit</Link>{' '}
                      <form action={deleteCategory} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton message={`Delete the category “${c.name}”?`} className="btn btn--danger btn--sm" title="Delete"><Icon name="trash" size={14} /></ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <section className="panel sticky-panel" key={editing?.id ?? 'new'}>
            <div className="panel__head">
              <h2>{editing ? 'Edit category' : 'Add category'}</h2>
              {editing && <Link href="/admin/categories" className="small">+ New instead</Link>}
            </div>
            <ActionForm action={saveCategory}>
              <input type="hidden" name="id" value={editing?.id ?? 0} />
              <label>Name *<input name="name" required maxLength={120} defaultValue={editing?.name} /></label>
              <label>URL slug <small className="muted">(blank = from name)</small><input name="slug" maxLength={140} pattern="[a-z0-9\-]*" defaultValue={editing?.slug} /></label>
              <label>Tagline<input name="tagline" maxLength={255} defaultValue={editing?.tagline ?? ''} /></label>
              <label>Description <small className="muted">(category page text, good for Google)</small><textarea name="description" rows={5} defaultValue={editing?.description ?? ''} /></label>
              <ImageInput name="image" label="Category image" current={editing?.image ? smallOf(editing.image) : null} />
              <label>Sort order<input type="number" name="sort_order" defaultValue={editing?.sort_order ?? (rows.length + 1)} /></label>
              <label className="check"><input type="checkbox" name="is_active" defaultChecked={editing ? !!editing.is_active : true} /> Visible on website</label>
              <button className="btn btn--gold btn--block">{editing ? 'Save category' : 'Add category'}</button>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}
