'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { PictureView, type PicData } from '@/components/PictureView';
import { telLink, waLink } from '@/lib/format';

interface NavCategory {
  slug: string;
  name: string;
  count: number;
  pic: PicData;
}

const NAV = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'about', href: '/about', label: 'About' },
  { key: 'certificates', href: '/certificates', label: 'Certificates' },
  { key: 'contact', href: '/contact', label: 'Contact' },
];

function activeKey(path: string): string {
  if (path === '/') return 'home';
  if (path.startsWith('/product')) return 'products';
  return path.split('/')[1] ?? '';
}

export function Header(props: {
  siteName: string;
  logo: string;
  phones: string[];
  waNumber: string;
  categories: NavCategory[];
  productTotal: number;
}) {
  const { siteName, logo, phones, waNumber, categories, productTotal } = props;
  const pathname = usePathname();
  const active = activeKey(pathname);
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const primary = phones[0] ?? '';

  // Close the drawer and mega menu after navigating.
  useEffect(() => {
    setOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !burgerRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const link = (key: string, href: string, label: string) => (
    <li className="nav__item" key={key}>
      <Link href={href} className={`nav__link${active === key ? ' is-active' : ''}`}>{label}</Link>
    </li>
  );

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <p className="topbar__msg"><span className="topbar__dot" /> Wholesale · Custom fabrication · Service — Kalupur, Ahmedabad</p>
          <div className="topbar__links">
            {phones.map((p, i) => (
              <a key={p} href={telLink(p)} className={i > 0 ? 'hide-sm' : ''}>{p}</a>
            ))}
          </div>
        </div>
      </div>

      <header className="header" id="header">
        <div className="container header__inner">
          <Link className="brand" href="/" aria-label={`${siteName} — Home`}>
            <img src={logo} alt="" width={52} height={52} className="brand__logo" />
            <span className="brand__text">
              <span className="brand__name">{siteName}</span>
              <span className="brand__sub">Ahmedabad</span>
            </span>
          </Link>

          <nav className={`nav${open ? ' is-open' : ''}`} id="primary-nav" aria-label="Primary" ref={navRef}>
            <ul className="nav__list">
              {link('home', '/', 'Home')}
              <li className={`nav__item has-mega${megaOpen ? ' is-open' : ''}`}>
                <Link href="/products" className={`nav__link${active === 'products' ? ' is-active' : ''}`}>Products</Link>
                <button className="nav__caret" aria-expanded={megaOpen} aria-label="Show product categories"
                  onClick={(e) => { e.preventDefault(); setMegaOpen((v) => !v); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <div className="mega">
                  <div className="mega__grid">
                    {categories.map((c) => (
                      <Link key={c.slug} href={`/products/${c.slug}`} className="mega__item">
                        <span className="mega__thumb"><PictureView data={c.pic} /></span>
                        <span><strong>{c.name}</strong><small>{c.count} models</small></span>
                      </Link>
                    ))}
                  </div>
                  <aside className="mega__promo">
                    <img src="/assets/img/brand/solid.png" alt="SOLID — registered brand" width={160} height={73} loading="lazy" />
                    <p>Our own registered brand of commercial kitchen equipment, made for daily heavy use.</p>
                    <Link href="/products" className="link-arrow">Browse all {productTotal} products <Icon name="arrow" size={16} /></Link>
                  </aside>
                </div>
              </li>
              {NAV.slice(1).map((n) => link(n.key, n.href, n.label))}
            </ul>
            <div className="nav__mobile-cta">
              {primary && <a href={telLink(primary)} className="btn btn--outline btn--block"><Icon name="phone" size={18} /> Call {primary}</a>}
              <a href={waLink(waNumber, `Hello ${siteName}, I would like a quote.`)} className="btn btn--wa btn--block" target="_blank" rel="noopener">
                <Icon name="whatsapp" size={18} /> WhatsApp us
              </a>
            </div>
          </nav>

          <div className="header__actions">
            <button className="icon-btn" type="button" data-search-open aria-label="Search products"><Icon name="search" size={20} /></button>
            {primary && (
              <a href={telLink(primary)} className="header__call hide-md">
                <span className="header__call-icon"><Icon name="phone" size={16} /></span>
                <span><small>Call us</small>{primary}</span>
              </a>
            )}
            <a href="/contact#inquiry" className="btn btn--dark btn--sm hide-sm" data-quick-inquiry>Get a quote</a>
            <button className="hamburger" id="hamburger" ref={burgerRef} aria-label={open ? 'Close menu' : 'Open menu'}
              aria-controls="primary-nav" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
