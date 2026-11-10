import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
};

/**
 * Root layout shared by the public site and the admin panel. Each area brings its own
 * stylesheet and fonts from its own layout: app/(site)/layout.tsx and app/admin/layout.tsx.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script below adds classes to <html> before hydration.
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script
          // Same as the PHP site: enable JS-only styles and show the preloader once per session.
          dangerouslySetInnerHTML={{
            __html:
              "(function(d){d.classList.add('js');try{if(location.pathname.indexOf('/admin')!==0&&!sessionStorage.getItem('rgs-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('show-preloader');sessionStorage.setItem('rgs-seen','1');}}catch(e){}})(document.documentElement);",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
