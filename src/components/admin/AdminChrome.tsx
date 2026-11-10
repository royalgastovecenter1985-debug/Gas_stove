'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'store' },
  { href: '/admin/products', label: 'Products', icon: 'tag' },
  { href: '/admin/categories', label: 'Categories', icon: 'layers' },
  { href: '/admin/inquiries', label: 'Inquiries', icon: 'chat' },
  { href: '/admin/certificates', label: 'Certificates', icon: 'award' },
  { href: '/admin/about', label: 'About page', icon: 'file' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: 'quote' },
  { href: '/admin/reels', label: 'Instagram Reels', icon: 'instagram' },
  { href: '/admin/settings', label: 'Website settings', icon: 'tool' },
];

const TITLES: [RegExp, string][] = [
  [/^\/admin\/products\/new/, 'Add product'],
  [/^\/admin\/products\/\d+/, 'Edit product'],
  ...NAV.slice(1).map((n) => [new RegExp('^' + n.href), n.label] as [RegExp, string]),
  [/^\/admin\/?$/, 'Dashboard'],
];

export function AdminChrome(props: {
  adminName: string;
  logo: string;
  newInquiries: number;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Admin';
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <>
      <aside className={`sidebar${open ? ' is-open' : ''}`} id="sidebar">
        <Link href="/admin" className="sidebar__brand">
          <img src={props.logo} alt="" width={38} height={38} />
          <span>Royal Admin</span>
        </Link>
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`sidebar__link${isActive(n.href) ? ' is-active' : ''}`}>
              <Icon name={n.icon} size={18} /> {n.label}
              {n.href === '/admin/inquiries' && props.newInquiries > 0 && <span className="pill">{props.newInquiries}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar__foot">
          <a href="/" target="_blank" rel="noopener" className="sidebar__link"><Icon name="eye" size={18} /> View website</a>
          <form action={props.logout}>
            <button className="sidebar__link sidebar__logout"><Icon name="logout" size={18} /> Log out</button>
          </form>
        </div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu"><Icon name="menu" size={22} /></button>
          <h1>{title}</h1>
          <span className="topbar__user">Hi, {props.adminName}</span>
        </header>
        <div className="content">{props.children}</div>
      </div>
    </>
  );
}
