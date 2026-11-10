'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';

export type ImageItem =
  | { kind: 'existing'; path: string; url: string }
  | { kind: 'new'; id: string; file: File; url: string };

const MAX = 15;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Product photo manager: add many photos at once (or drop them), drag to reorder,
 * make any photo the main one, remove photos. The first photo is the main image.
 */
export function ImageManager({ items, onChange }: { items: ImageItem[]; onChange: (next: ImageItem[]) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(items);
  latest.current = items;

  // Free preview URLs of removed new photos when the component unmounts.
  useEffect(() => () => latest.current.forEach((i) => i.kind === 'new' && URL.revokeObjectURL(i.url)), []);

  const add = (files: FileList | File[]) => {
    const list = Array.from(files);
    const ok = list.filter((f) => ACCEPT.includes(f.type) && f.size <= 10 * 1024 * 1024);
    const room = MAX - items.length;
    const added: ImageItem[] = ok.slice(0, Math.max(0, room)).map((file) => ({
      kind: 'new', id: Math.random().toString(36).slice(2), file, url: URL.createObjectURL(file),
    }));
    const skipped = list.length - added.length;
    setNote(skipped > 0 ? `${skipped} file(s) skipped — only JPG, PNG or WebP up to 10 MB, max ${MAX} photos.` : '');
    if (added.length) onChange([...items, ...added]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  const remove = (i: number) => {
    const it = items[i];
    if (it.kind === 'new') URL.revokeObjectURL(it.url);
    onChange(items.filter((_, k) => k !== i));
  };

  return (
    <div className="imgmgr">
      {items.length > 0 && (
        <ul className="imgmgr__grid">
          {items.map((it, i) => (
            <li
              key={it.kind === 'existing' ? it.path : it.id}
              className={`imgmgr__item${i === 0 ? ' is-main' : ''}${dragIndex === i ? ' is-dragging' : ''}`}
              draggable
              onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); }}
              onDragEnd={() => setDragIndex(null)}
            >
              <img src={it.url} alt="" />
              {i === 0 ? <span className="imgmgr__badge">Main image</span> : it.kind === 'new' && <span className="imgmgr__badge imgmgr__badge--new">New</span>}
              <div className="imgmgr__tools">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left" title="Move left"><Icon name="left" size={14} /></button>
                {i !== 0 && <button type="button" onClick={() => move(i, 0)} title="Make main image" className="imgmgr__main">★ Main</button>}
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move right" title="Move right"><Icon name="right" size={14} /></button>
                <button type="button" onClick={() => remove(i)} className="imgmgr__del" aria-label="Remove photo" title="Remove photo"><Icon name="trash" size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        className={`imgmgr__drop${over ? ' is-over' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { if (dragIndex === null) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (dragIndex === null) add(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
      >
        <Icon name="upload" size={22} />
        <strong>Add photos</strong>
        <span className="small muted">Click or drop several photos here · JPG, PNG, WebP · max 10 MB each · {items.length}/{MAX}</span>
        <input ref={input} type="file" accept={ACCEPT.join(',')} multiple hidden
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ''; }} />
      </div>
      {note && <p className="small" style={{ color: 'var(--danger)' }}>{note}</p>}
      <p className="small muted">Drag photos to change the order. The first photo is the main image on product cards. Photos are resized and converted to fast WebP automatically.</p>
    </div>
  );
}
