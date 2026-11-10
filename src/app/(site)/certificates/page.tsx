import type { Metadata } from 'next';
import Link from 'next/link';
import { Picture } from '@/components/Picture';
import { getCertificates } from '@/lib/data';
import { imgSrc } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Certificates & Registrations',
  description: 'Registrations of Royal Gas Stove Center, Ahmedabad, including the SOLID™ trade mark registered with the Trade Marks Registry, Government of India.',
  alternates: { canonical: '/certificates' },
};

export default async function CertificatesPage() {
  const certificates = await getCertificates();
  return (
    <>
      <section className="page-head">
        <div className="container">
          <ol className="breadcrumb"><li><Link href="/">Home</Link></li><li>Certificates</li></ol>
          <h1>Certificates &amp; registrations</h1>
          <p>A registered business you can buy from with confidence. Click a certificate to view it full size.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'clamp(28px, 4vw, 48px)' }}>
        <div className="container">
          {certificates.length > 0 ? (
            <div className="cert-grid">
              {certificates.map((c, i) => (
                <a key={c.id} href={imgSrc(c.image)} className="cert-card reveal" style={{ '--d': `${(i % 3) * 80}ms` } as React.CSSProperties}
                  data-lightbox="certificates" data-caption={c.title}>
                  <div className="cert-card__media"><Picture path={c.image} alt={c.title} w={550} h={765} /></div>
                  <div className="cert-card__body">
                    <h3>{c.title}</h3>
                    <span>{[c.issued_by, c.year].filter(Boolean).join(' · ')}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h3>Certificates coming soon</h3><p className="muted">Please contact us for copies of our registrations.</p></div>
          )}
        </div>
      </section>
    </>
  );
}
