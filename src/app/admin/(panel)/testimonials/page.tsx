import Link from 'next/link';
import { deleteTestimonial, saveTestimonial } from '@/app/admin/actions/content';
import { Flash, spStr, type SP } from '@/components/admin/Flash';
import { ToggleActive } from '@/components/admin/ToggleActive';
import { ActionForm, ConfirmButton } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata = { title: 'Testimonials' };

interface Row { id: number; name: string; designation: string | null; message: string; product: string | null; rating: number; sort_order: number; is_active: number }

export default async function TestimonialsAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await query<Row>('SELECT * FROM testimonials ORDER BY sort_order, id');
  const editId = parseInt(spStr(sp, 'edit'), 10) || 0;
  const editing = rows.find((r) => r.id === editId) ?? null;

  return (
    <>
      <Flash sp={sp} />
      <div className="form-layout">
        <section className="panel">
          <h2>Customer reviews on the home page</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Customer</th><th>Review</th><th>Rating</th><th>Visible</th><th className="right">Actions</th></tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className={t.id === editId ? 'is-selected' : t.is_active ? '' : 'is-muted'}>
                    <td><strong>{t.name}</strong><div className="small muted">{t.designation}</div>{t.product && <div className="small">{t.product}</div>}</td>
                    <td className="msg small">{t.message.length > 180 ? t.message.slice(0, 180) + '…' : t.message}</td>
                    <td className="nowrap">{'★'.repeat(t.rating)}</td>
                    <td><ToggleActive table="testimonials" id={t.id} on={!!t.is_active} /></td>
                    <td className="right nowrap">
                      <Link className="btn btn--outline btn--sm" href={`/admin/testimonials?edit=${t.id}`}><Icon name="edit" size={14} /> Edit</Link>{' '}
                      <form action={deleteTestimonial} className="inline">
                        <input type="hidden" name="id" value={t.id} />
                        <ConfirmButton message={`Delete the review from ${t.name}?`} className="btn btn--danger btn--sm" title="Delete"><Icon name="trash" size={14} /></ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={5} className="muted center">No testimonials yet. The section is hidden on the website until you add one.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <section className="panel sticky-panel" key={editing?.id ?? 'new'}>
            <div className="panel__head">
              <h2>{editing ? 'Edit testimonial' : 'Add testimonial'}</h2>
              {editing && <Link href="/admin/testimonials" className="small">+ New instead</Link>}
            </div>
            <ActionForm action={saveTestimonial}>
              <input type="hidden" name="id" value={editing?.id ?? 0} />
              <label>Customer name *<input name="name" required maxLength={120} defaultValue={editing?.name} /></label>
              <label>Business / source <small className="muted">(e.g. “Google review”)</small><input name="designation" maxLength={160} defaultValue={editing?.designation ?? ''} /></label>
              <label>Review *<textarea name="message" rows={5} required maxLength={3000} defaultValue={editing?.message} /></label>
              <label>Product bought<input name="product" maxLength={180} defaultValue={editing?.product ?? ''} /></label>
              <div className="grid-2">
                <label>Rating
                  <select name="rating" defaultValue={editing?.rating ?? 5}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select>
                </label>
                <label>Sort order<input type="number" name="sort_order" defaultValue={editing?.sort_order ?? rows.length + 1} /></label>
              </div>
              <label className="check"><input type="checkbox" name="is_active" defaultChecked={editing ? !!editing.is_active : true} /> Visible on website</label>
              <button className="btn btn--gold btn--block">{editing ? 'Save testimonial' : 'Add testimonial'}</button>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}
