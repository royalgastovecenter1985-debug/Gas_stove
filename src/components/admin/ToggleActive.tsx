import { toggleActive } from '@/app/admin/actions/content';

/** One-click "visible on website" switch for categories, certificates, testimonials and reels. */
export function ToggleActive({ table, id, on }: { table: 'categories' | 'certificates' | 'testimonials' | 'reels'; id: number; on: boolean }) {
  return (
    <form action={toggleActive}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button className={`toggle${on ? ' is-on' : ''}`} aria-pressed={on} aria-label="Visible on website" title={on ? 'Visible — click to hide' : 'Hidden — click to show'}><span /></button>
    </form>
  );
}
