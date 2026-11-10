import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { InquiryForm } from '@/components/site/InquiryForm';
import { getCategories } from '@/lib/data';
import { telLink, waLink, waNumber } from '@/lib/format';
import { getSettings, phones } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: 'Contact Us',
    description: `Contact ${s.site_name}, Kalupur Tower Road, Ahmedabad. Call ${phones(s).join(', ')} or WhatsApp for quotes on commercial kitchen equipment.`,
    alternates: { canonical: '/contact' },
  };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactPage({ searchParams }: Props) {
  const [s, cats, sp] = await Promise.all([getSettings(), getCategories(), searchParams]);
  const wa = waNumber(s.whatsapp);
  const lat = encodeURIComponent(s.map_lat);
  const lng = encodeURIComponent(s.map_lng);
  const product = String(sp.product ?? '').slice(0, 200);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <ol className="breadcrumb"><li><Link href="/">Home</Link></li><li>Contact</li></ol>
          <h1>Let’s talk about your kitchen</h1>
          <p>Call, WhatsApp, visit the showroom, or send an inquiry — we usually reply within a few business hours.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'clamp(28px, 4vw, 48px)' }}>
        <div className="container">
          <div className="contact-cards reveal">
            <div className="contact-card">
              <div className="contact-card__icon"><Icon name="phone" size={20} /></div>
              <div><h3>Call us</h3>{phones(s).map((p) => <p key={p}><a href={telLink(p)}>{p}</a></p>)}</div>
            </div>
            <div className="contact-card">
              <div className="contact-card__icon contact-card__icon--wa"><Icon name="whatsapp" size={20} /></div>
              <div><h3>WhatsApp</h3><p><a href={waLink(wa, `Hello ${s.site_name}, I have an inquiry.`)} target="_blank" rel="noopener">+{wa}</a></p><p>Send photos &amp; sizes</p></div>
            </div>
            <div className="contact-card">
              <div className="contact-card__icon"><Icon name="pin" size={20} /></div>
              <div><h3>Showroom</h3><p>{s.address}</p></div>
            </div>
            <div className="contact-card">
              <div className="contact-card__icon"><Icon name="clock" size={20} /></div>
              <div><h3>Hours</h3><p>{s.business_hours}</p>{s.email && <p><a href={`mailto:${s.email}`}>{s.email}</a></p>}</div>
            </div>
          </div>

          <div className="contact-block" id="inquiry">
            <div className="contact-block__form reveal">
              <h2 className="head__title">Request a quotation</h2>
              <p className="head__sub">Tell us the product, size and quantity.</p>
              <InquiryForm formId="contact" source="contact" product={product} productOptions={cats.map((c) => c.name)} waNumber={wa} />
            </div>
            <div className="reveal" style={{ '--d': '120ms', display: 'grid', gap: 12, gridTemplateRows: '1fr auto' } as React.CSSProperties}>
              <div className="map-full">
                <iframe title={`${s.site_name} on Google Maps`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`} />
              </div>
              <a className="btn btn--outline" href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener"><Icon name="pin" size={18} /> Get directions</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
