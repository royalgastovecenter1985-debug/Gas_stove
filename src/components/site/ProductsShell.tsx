'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Icon } from '@/components/Icon';

interface Cat {
  slug: string;
  name: string;
  count: number;
}

/** Category filter + live search for /products. The grid itself is rendered on the server. */
export function ProductsShell(props: {
  category: string;
  initialQ: string;
  categories: Cat[];
  total: number;
  resultCount: number;
  customSizeWa: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  const { category, initialQ, categories, total, resultCount, customSizeWa, intro, children } = props;
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const chipsRef = useRef<HTMLElement>(null);

  const hrefFor = (slug: string, term = q.trim()) => `/products${slug ? '/' + slug : ''}${term ? '?q=' + encodeURIComponent(term) : ''}`;
  const go = (term: string) => startTransition(() => router.replace(hrefFor(category, term), { scroll: false }));

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    // Keep the active chip visible on small screens.
    if (window.innerWidth < 1024) chipsRef.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [category]);

  return (
    <div className="container shop" id="productFilter">
      <aside className="shop__side" aria-label="Categories">
        <p className="side-title">Categories</p>
        <nav className="side-cats">
          <Link href={hrefFor('')} scroll={false} className={!category ? 'is-active' : ''} aria-current={!category || undefined}>All products <small>{total}</small></Link>
          {categories.map((c) => (
            <Link key={c.slug} href={hrefFor(c.slug)} scroll={false} className={category === c.slug ? 'is-active' : ''} aria-current={category === c.slug || undefined}>
              {c.name} <small>{c.count}</small>
            </Link>
          ))}
        </nav>
        <div className="side-card">
          <strong>Need a custom size?</strong>
          <p>Most of our equipment is built to order. Send us your measurements.</p>
          <a href={customSizeWa} className="btn btn--wa btn--sm btn--block" target="_blank" rel="noopener"><Icon name="whatsapp" size={16} /> WhatsApp us</a>
        </div>
      </aside>

      <div className="shop__main">
        <div className="toolbar">
          <form className="search-wrap" role="search" action={hrefFor(category, '')} method="get"
            onSubmit={(e) => { e.preventDefault(); clearTimeout(timer.current); go(q.trim()); }}>
            <Icon name="search" size={18} />
            <label htmlFor="productSearch" className="sr-only">Search products</label>
            <input id="productSearch" className="search-input" type="search" name="q" value={q} autoComplete="off"
              placeholder="Search by name, e.g. bullet puffer, double sink…"
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => go(v.trim()), 300);
              }} />
          </form>
          <nav className="chips" aria-label="Filter by category" ref={chipsRef}>
            <Link href={hrefFor('')} scroll={false} className={`chip${!category ? ' is-active' : ''}`}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={hrefFor(c.slug)} scroll={false} className={`chip${category === c.slug ? ' is-active' : ''}`}>{c.name}</Link>
            ))}
          </nav>
        </div>

        {intro}

        <div className="results-meta">
          <span id="resultCount">{resultCount} product{resultCount === 1 ? '' : 's'}</span>
          <a href="/brochure" className="link-arrow"><Icon name="download" size={16} /> Brochure</a>
        </div>

        <div className={`product-grid${pending ? ' is-loading' : ''}`} id="productGrid" aria-live="polite">
          {children}
        </div>
      </div>
    </div>
  );
}
