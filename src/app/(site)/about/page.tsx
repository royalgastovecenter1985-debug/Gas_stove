import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Picture } from '@/components/Picture';
import { Inline, Paragraphs } from '@/components/site/RichText';
import { catalogCounts, getCertificates } from '@/lib/data';
import { imgSrc, telLink } from '@/lib/format';
import { clientList, getAbout, getSettings, phones } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const a = await getAbout();
  return {
    title: 'About Us',
    description: a.pageIntro || 'About Royal Gas Stove Center — supplying, fabricating and servicing commercial kitchen equipment under its registered SOLID™ brand.',
    alternates: { canonical: '/about' },
  };
}

const tile = { borderColor: 'var(--line)' } as React.CSSProperties;
const ink = { color: 'var(--ink)' } as React.CSSProperties;

export default async function AboutPage() {
  const [s, a, counts, certs] = await Promise.all([getSettings(), getAbout(), catalogCounts(), getCertificates(1)]);
  const certificate = certs[0] ?? null;
  const segments = clientList(s);
  const workshopPhones = a.workshopPhones.split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <ol className="breadcrumb"><li><Link href="/">Home</Link></li><li>About</li></ol>
          <h1>{a.pageTitle}</h1>
          <p>{a.pageIntro}</p>
        </div>
      </section>

      <section className="section">
        <div className="container about-hero">
          <div className="about-photos reveal">
            <figure className="about-photos__main">
              <Picture path={a.photoMain} alt={a.photoMainCaption || s.site_name} lazy={false} w={720} h={1280} sizes="(min-width:1024px) 30vw, 60vw" />
              {a.photoMainCaption && <figcaption><Icon name="pin" size={14} /> {a.photoMainCaption}</figcaption>}
            </figure>
            {a.photoSide1 && <figure className="about-photos__side"><Picture path={a.photoSide1} alt="" w={720} h={1280} sizes="(min-width:1024px) 18vw, 40vw" /></figure>}
            {a.photoSide2 && <figure className="about-photos__side"><Picture path={a.photoSide2} alt="" w={720} h={1280} sizes="(min-width:1024px) 18vw, 40vw" /></figure>}
          </div>
          <div>
            <h2 className="head__title reveal">{a.heading}</h2>
            <div className="prose reveal" style={{ marginTop: 18 }}><Paragraphs text={a.body} /></div>
            <div className="stat-tiles" style={{ marginBottom: 0 }}>
              <div className="stat-tile reveal" style={tile}><strong style={ink} data-count={counts.products}>0</strong><span className="muted">Products</span></div>
              <div className="stat-tile reveal" style={{ ...tile, '--d': '80ms' } as React.CSSProperties}><strong style={ink} data-count={counts.categories}>0</strong><span className="muted">Categories</span></div>
              <div className="stat-tile reveal" style={{ ...tile, '--d': '160ms' } as React.CSSProperties}><strong style={ink}>2012</strong><span className="muted">SOLID™ registered</span></div>
              {s.google_rating && (
                <div className="stat-tile reveal" style={{ ...tile, '--d': '240ms' } as React.CSSProperties}><strong style={ink}>{s.google_rating}★</strong><span className="muted">{s.google_review_count} Google reviews</span></div>
              )}
            </div>
          </div>
        </div>
      </section>

      {a.values.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <div className="head"><h2 className="head__title reveal">{a.valuesTitle}</h2></div>
            <div className="values reveal">
              {a.values.map((v, i) => (
                <div className="value" key={i}><h3><Icon name={v.icon} size={22} /> {v.title}</h3><p>{v.text}</p></div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container two-col">
          <div className="reveal">
            <h2 className="head__title">{a.servicesTitle}</h2>
            <ul className="checklist" style={{ marginTop: 20 }}>
              {a.services.map((x, i) => <li key={i}><Icon name="check" size={18} /> {x}</li>)}
            </ul>
            {segments.length > 0 && (
              <>
                <h3 style={{ marginTop: 32 }}>Who we serve</h3>
                <ul className="segment-list">{segments.map((x) => <li key={x}>{x}</li>)}</ul>
              </>
            )}
          </div>
          {certificate && (
            <a href={imgSrc(certificate.image)} className="cert-card reveal" style={{ '--d': '120ms', maxWidth: 420, justifySelf: 'center' } as React.CSSProperties}
              data-lightbox="about-cert" data-caption={certificate.title}>
              <div className="cert-card__media"><Picture path={certificate.image} alt={certificate.title} w={550} h={765} /></div>
              <div className="cert-card__body"><h3>{certificate.title}</h3><span>{[certificate.issued_by, certificate.year].filter(Boolean).join(' · ')}</span></div>
            </a>
          )}
        </div>
      </section>

      <section className="section section--soft">
        <div className="container visit">
          {a.boardImage && (
            <a href={imgSrc(a.boardImage)} className="visit__board reveal" data-lightbox="board" data-caption={`${s.site_name} & ${a.workshopName}`}>
              <Picture path={a.boardImage} alt={`Business board of ${s.site_name}`} w={1400} h={852} sizes="(min-width:1024px) 50vw, 100vw" />
            </a>
          )}
          <div className="reveal" style={{ '--d': '100ms' } as React.CSSProperties}>
            <h2 className="head__title">{a.workshopTitle}</h2>
            <p className="head__sub" style={{ marginBottom: 20 }}><Inline text={a.workshopIntro} /></p>
            <div className="visit__cards">
              <div className="visit__card">
                <strong>{s.site_name}</strong>
                <span>Showroom &amp; sales</span>
                <p>{s.address}</p>
                <p>
                  {[...(a.showroomLandline ? [a.showroomLandline] : []), ...phones(s)].map((p, i) => (
                    <span key={p}>{i > 0 && ' · '}<a href={telLink(p)}>{p}</a></span>
                  ))}
                </p>
              </div>
              {a.workshopName && (
                <div className="visit__card">
                  <strong>{a.workshopName}</strong>
                  <span>{a.workshopRole}</span>
                  <p>{a.workshopAddress}</p>
                  <p>{workshopPhones.map((p, i) => <span key={p}>{i > 0 && ' · '}<a href={telLink(p)}>{p}</a></span>)}</p>
                </div>
              )}
            </div>
            {s.email && <p style={{ marginTop: 16 }}><Icon name="mail" size={16} /> <a className="link-arrow" href={`mailto:${s.email}`}>{s.email}</a></p>}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band__inner reveal">
          <div>
            <h2>{a.ctaTitle}</h2>
            <p>{s.address} · {s.business_hours}</p>
          </div>
          <div className="cta-band__actions">
            <Link href="/contact" className="btn btn--dark"><Icon name="pin" size={18} /> Get directions</Link>
            <a href="/brochure" className="btn btn--outline"><Icon name="download" size={18} /> Brochure</a>
          </div>
        </div>
      </section>
    </>
  );
}
