'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { EV_SEARCH } from '@/lib/client-events';

interface Hit {
  name: string;
  url: string;
  image: string;
  category: string;
  size: string;
}

/** Header search overlay with live suggestions. Opened by [data-search-open] or the "/" key. */
export function SearchSheet({ popular }: { popular: { slug: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ items: Hit[]; count: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener(EV_SEARCH, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(EV_SEARCH, onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits(null); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?format=list&q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setHits(await res.json());
      } catch { /* aborted */ }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const term = q.trim();
  return (
    <div className="search-sheet" id="searchSheet" hidden={!open}>
      <div className="search-sheet__backdrop" onClick={() => setOpen(false)} />
      <div className="search-sheet__panel" role="dialog" aria-modal="true" aria-label="Search products">
        <form className="container search-sheet__form" action="/products" method="get" role="search">
          <Icon name="search" size={22} />
          <input ref={input} type="search" name="q" id="searchInput" placeholder="Search burners, bhattis, sinks, ovens…"
            autoComplete="off" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close search"><Icon name="close" size={20} /></button>
        </form>
        <div className="container">
          <div className="search-sheet__results" id="searchResults" aria-live="polite">
            {hits && hits.items.length > 0 && (
              <>
                {hits.items.map((p) => (
                  <Link key={p.url} className="search-hit" href={p.url}>
                    <img src={p.image} alt="" loading="lazy" />
                    <span><strong>{p.name}</strong><small>{p.category}{p.size ? ` · ${p.size} in` : ''}</small></span>
                  </Link>
                ))}
                <Link className="link-arrow" style={{ margin: '10px 8px' }} href={`/products?q=${encodeURIComponent(term)}`}>See all {hits.count} results →</Link>
              </>
            )}
            {hits && hits.items.length === 0 && (
              <p className="muted" style={{ padding: 8 }}>
                No matches for “{term}”. We also fabricate to order — <a href="#" data-quick-inquiry data-product={term} className="link-arrow" onClick={() => setOpen(false)}>ask us</a>.
              </p>
            )}
          </div>
          <div className="search-sheet__popular">
            <span>Popular:</span>
            {popular.map((c) => <Link key={c.slug} href={`/products/${c.slug}`}>{c.name}</Link>)}
          </div>
        </div>
      </div>
    </div>
  );
}
