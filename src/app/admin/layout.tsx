import type { Metadata } from 'next';
import './admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin · Royal Gas Stove Center', template: '%s · Admin · Royal Gas Stove Center' },
  robots: { index: false, follow: false },
  icons: { icon: '/assets/img/favicon.png' },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" precedence="default"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600&display=swap" />
      <div className="admin">{children}</div>
    </>
  );
}
