import Link from 'next/link';
import { deleteReel, saveReel } from '@/app/admin/actions/content';
import { Flash, spStr, type SP } from '@/components/admin/Flash';
import { ToggleActive } from '@/components/admin/ToggleActive';
import { ActionForm, ConfirmButton, ImageInput } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { imgSrc } from '@/lib/format';
import { smallOf } from '@/lib/picture';

export const metadata = { title: 'Instagram Reels' };

interface Row { id: number; title: string; link: string | null; poster: string; video: string | null; sort_order: number; is_active: number }

export default async function ReelsAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await query<Row>('SELECT * FROM reels ORDER BY sort_order, id');
  const editId = parseInt(spStr(sp, 'edit'), 10) || 0;
  const editing = rows.find((r) => r.id === editId) ?? null;

  return (
    <>
      <Flash sp={sp} />
      <div className="form-layout">
        <section className="panel">
          <div className="panel__head"><h2>“Royal Reels” row on the home page</h2><span className="muted small">{rows.length} reels</span></div>
          <div className="card-grid">
            {rows.map((r) => (
              <div key={r.id} className={`mini-card${r.is_active ? '' : ' is-hidden'}`}>
                <img src={smallOf(r.poster)} alt="" style={{ aspectRatio: '9/16' }} />
                <strong className="small">{r.title}</strong>
                <span className="small muted">{r.video ? '▶ Plays video' : 'Cover image only'}{r.link ? ' · linked' : ''}</span>
                <div className="mini-card__actions">
                  <ToggleActive table="reels" id={r.id} on={!!r.is_active} />
                  <Link className="btn btn--outline btn--sm" href={`/admin/reels?edit=${r.id}`}><Icon name="edit" size={14} /> Edit</Link>
                  <form action={deleteReel} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmButton message="Delete this reel?" className="btn btn--danger btn--sm" title="Delete"><Icon name="trash" size={14} /></ConfirmButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
          {!rows.length && <p className="muted">No reels yet. The section is hidden on the website until you add one.</p>}
        </section>

        <aside>
          <section className="panel sticky-panel" key={editing?.id ?? 'new'}>
            <div className="panel__head">
              <h2>{editing ? 'Edit reel' : 'Add reel'}</h2>
              {editing && <Link href="/admin/reels" className="small">+ New instead</Link>}
            </div>
            <ActionForm action={saveReel}>
              <input type="hidden" name="id" value={editing?.id ?? 0} />
              <label>Caption *<input name="title" required maxLength={160} defaultValue={editing?.title} /></label>
              <label>Instagram reel link <small className="muted">(Share → Copy link)</small><input name="link" type="url" maxLength={255} defaultValue={editing?.link ?? ''} placeholder="https://www.instagram.com/reel/…" /></label>
              <ImageInput name="poster" label={editing ? 'Cover image' : 'Cover image *'} current={editing ? smallOf(editing.poster) : null} hint="Portrait (9:16) works best." />
              <label>Video (MP4, optional, max 40 MB)
                <input type="file" name="video" accept="video/mp4,video/webm" />
              </label>
              {editing?.video && (
                <p className="small">Current video: <a href={imgSrc(editing.video)} target="_blank" rel="noopener">open</a>
                  <label className="check" style={{ marginTop: 6 }}><input type="checkbox" name="remove_video" /> Remove video</label>
                </p>
              )}
              <p className="small muted">Keep clips short (about 15 seconds) so the home page stays fast. They play muted and on loop.</p>
              <label>Sort order<input type="number" name="sort_order" defaultValue={editing?.sort_order ?? rows.length + 1} /></label>
              <label className="check"><input type="checkbox" name="is_active" defaultChecked={editing ? !!editing.is_active : true} /> Visible on website</label>
              <button className="btn btn--gold btn--block">{editing ? 'Save reel' : 'Add reel'}</button>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}
