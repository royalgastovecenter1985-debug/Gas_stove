import type { Metadata, Viewport } from 'next';
import './site.css';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { InquiryModal } from '@/components/site/InquiryModal';
import { JsonLd } from '@/components/site/JsonLd';
import { SearchSheet } from '@/components/site/SearchSheet';
import { SiteEffects } from '@/components/site/SiteEffects';
import { catalogCounts, getCategories } from '@/lib/data';
import { imgSrc, waNumber } from '@/lib/format';
import { pictureData } from '@/lib/picture';
import { siteUrl } from '@/lib/request';
import { getSettings, phones, socialLinks } from '@/lib/settings';

// Pages read the database on every request, so admin changes show immediately.
export const dynamic = 'force-dynamic';

export const viewport: Viewport = { themeColor: '#141414' };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.site_name || 'Royal Gas Stove Center';
  return {
    title: { default: `${name} — Commercial Kitchen Equipment, Ahmedabad`, template: `%s | ${name}` },
    description:
      `${name}, Kalupur, Ahmedabad — home of the SOLID™ brand. Commercial cooking ranges, dom burners, puffer & dhosa bhattis, SS tables, sinks, ovens, Ben Marie and shawarma machines. Wholesale, custom fabrication and service.`,
    icons: { icon: imgSrc(s.favicon), apple: '/assets/img/apple-touch-icon.png' },
    openGraph: { siteName: name, type: 'website', locale: 'en_IN', images: ['/assets/img/og-image.jpg'] },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, categories, counts] = await Promise.all([getSettings(), getCategories(true), catalogCounts()]);
  const name = s.site_name || 'Royal Gas Stove Center';
  const nums = phones(s);
  const navCats = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: c.product_count ?? 0,
    pic: pictureData(c.image, { w: 120, h: 90, sizes: '60px' }),
  }));

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': siteUrl('#business'),
    name,
    description: 'Wholesale trader, supplier, distributor and service provider of commercial kitchen equipment. Home of the SOLID brand.',
    url: siteUrl(),
    logo: siteUrl(s.logo),
    image: siteUrl('assets/img/og-image.jpg'),
    telephone: nums[0] ?? '',
    email: s.email || undefined,
    priceRange: '₹₹',
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Ahmedabad', addressRegion: 'Gujarat', addressCountry: 'IN' },
    geo: { '@type': 'GeoCoordinates', latitude: Number(s.map_lat), longitude: Number(s.map_lng) },
    openingHours: `Mo-Sa ${s.open_time || '09:30'}-${s.close_time || '20:30'}`,
    sameAs: socialLinks(s).map((x) => x.href),
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" precedence="default"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap" />
      <JsonLd data={localBusiness} />

      <a className="skip-link" href="#main">Skip to content</a>
      <div className="preloader" id="preloader" aria-hidden="true">
        <div className="preloader__inner">
          <img src={imgSrc(s.logo)} alt="" width={96} height={96} />
          <div className="preloader__bar"><span /></div>
        </div>
      </div>

      <Header
        siteName={name}
        logo={imgSrc(s.logo)}
        phones={nums}
        waNumber={waNumber(s.whatsapp)}
        categories={navCats}
        productTotal={counts.products}
      />
      <main id="main">{children}</main>
      <Footer />

      <SearchSheet popular={categories.slice(0, 6).map((c) => ({ slug: c.slug, name: c.name }))} />
      <InquiryModal waNumber={waNumber(s.whatsapp)} productOptions={categories.map((c) => c.name)} />
      <SiteEffects />
    </>
  );
}
