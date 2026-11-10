import Link from 'next/link';
import { deleteCertificate, saveCertificate } from '@/app/admin/actions/content';
import { Flash, spStr, type SP } from '@/components/admin/Flash';
import { ToggleActive } from '@/components/admin/ToggleActive';
import { ActionForm, ConfirmButton, ImageInput } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { imgSrc } from '@/lib/format';
import { smallOf } from '@/lib/picture';

export const metadata = { title: 'Certificates' };

interface Row { id: number; title: string; issued_by: string | null; year: string | null; image: string; sort_order: number; is_active: number }

export default async function CertificatesAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await query<Row>('SELECT * FROM certificates ORDER BY sort_order, id');
  const editId = parseInt(spStr(sp, 'edit'), 10) || 0;
  const editing = rows.find((r) => r.id === editId) ?? null;

  return (
    <>
      <Flash sp={sp} />
      <div className="form-layout">
        <section className="panel">
          <div className="panel__head"><h2>Certificates on the website</h2><a href="/certificates" target="_blank" rel="noopener" className="small">View page ↗</a></div>
          {rows.length ? (
            <div className="card-grid">
              {rows.map((c) => (
                <div key={c.id} className={`mini-card${c.is_active ? '' : ' is-hidden'}${c.id === editId ? ' is-selected' : ''}`}>
                  <a href={imgSrc(c.image)} target="_blank" rel="noopener"><img src={smallOf(c.image)} alt="" style={{ aspectRatio: '3/4' }} /></a>
                  <strong>{c.title}</strong>
                  <span className="small muted">{[c.issued_by, c.year].filter(Boolean).join(' · ') || '—'}</span>
                  <div className="mini-card__actions">
                    <ToggleActive table="certificates" id={c.id} on={!!c.is_active} />
                    <Link className="btn btn--outline btn--sm" href={`/admin/certificates?edit=${c.id}`}><Icon name="edit" size={14} /> Edit</Link>
                    <form action={deleteCertificate} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton message={`Delete “${c.title}”?`} className="btn btn--danger btn--sm" title="Delete"><Icon name="trash" size={14} /></ConfirmButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No certificates yet. Add your trade mark, GST, Udyam/MSME or ISO certificates.</p>}
        </section>

        <aside>
          <section className="panel sticky-panel" key={editing?.id ?? 'new'}>
            <div className="panel__head">
              <h2>{editing ? 'Edit certificate' : 'Add certificate'}</h2>
              {editing && <Link href="/admin/certificates" className="small">+ New instead</Link>}
            </div>
            <ActionForm action={saveCertificate}>
              <input type="hidden" name="id" value={editing?.id ?? 0} />
              <label>Title *<input name="title" required maxLength={160} defaultValue={editing?.title} placeholder="e.g. GST Registration" /></label>
              <label>Issued by<input name="issued_by" maxLength={160} defaultValue={editing?.issued_by ?? ''} placeholder="e.g. Government of India" /></label>
              <label>Year<input name="year" maxLength={10} defaultValue={editing?.year ?? ''} placeholder="e.g. 2012" /></label>
              <ImageInput name="image" label={editing ? 'Certificate scan' : 'Certificate scan *'} current={editing ? smallOf(editing.image) : null}
                hint="A photo or scan (JPG, PNG or WebP). Have a PDF? Take a screenshot of it." />
              <label>Sort order<input type="number" name="sort_order" defaultValue={editing?.sort_order ?? rows.length + 1} /></label>
              <label className="check"><input type="checkbox" name="is_active" defaultChecked={editing ? !!editing.is_active : true} /> Visible on website</label>
              <button className="btn btn--gold btn--block">{editing ? 'Save certificate' : 'Add certificate'}</button>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}
