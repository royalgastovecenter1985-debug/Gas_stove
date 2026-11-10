import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { getCategories } from '@/lib/data';
import { imgSrc, telLink, waLink } from '@/lib/format';
import { getSettings, phones, socialLinks } from '@/lib/settings';

export async function Footer() {
  const [s, cats] = await Promise.all([getSettings(), getCategories()]);
  const name = s.site_name || 'Royal Gas Stove Center';
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <Link className="brand brand--footer" href="/">
              <img src={imgSrc(s.logo)} alt="" width={64} height={64} loading="lazy" />
              <span className="brand__text"><span className="brand__name">{name}</span><span className="brand__sub">Home of SOLID™ · Kalupur, Ahmedabad</span></span>
            </Link>
            <div className="footer__cta">
              <a href={waLink(s.whatsapp, `Hello ${name}, I would like a quote.`)} className="btn btn--wa" target="_blank" rel="noopener"><Icon name="whatsapp" size={18} /> WhatsApp us</a>
              <a href="/brochure" className="btn btn--ghost-light"><Icon name="download" size={18} /> Brochure</a>
            </div>
          </div>

          <div className="footer__grid">
            <div className="footer__col">
              <h3 className="footer__title">Products</h3>
              <ul className="footer__links footer__links--2col">
                {cats.map((c) => <li key={c.id}><Link href={`/products/${c.slug}`}>{c.name}</Link></li>)}
              </ul>
            </div>
            <div className="footer__col">
              <h3 className="footer__title">Company</h3>
              <ul className="footer__links">
                <li><Link href="/about">About us</Link></li>
                <li><Link href="/products">All products</Link></li>
                <li><Link href="/certificates">Certificates</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><a href="/brochure">Download brochure</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h3 className="footer__title">Visit the showroom</h3>
              <address className="footer__address">{s.address}</address>
              <p className="footer__hours">{s.business_hours}</p>
              <ul className="footer__phones">
                {phones(s).map((p) => <li key={p}><a href={telLink(p)}>{p}</a></li>)}
                {s.email && <li><a href={`mailto:${s.email}`}>{s.email}</a></li>}
              </ul>
              <div className="socials">
                {socialLinks(s).map((x) => (
                  <a key={x.key} href={x.href} className="social" target="_blank" rel="noopener" aria-label={x.label}><Icon name={x.key} size={18} /></a>
                ))}
              </div>
            </div>
          </div>

          <div className="footer__bottom">
            <p>© {year} {name}. SOLID™ is a registered trade mark.</p>
            <p>Commercial kitchen equipment · Ahmedabad, Gujarat</p>
          </div>
        </div>
        <div className="footer__wordmark" aria-hidden="true">ROYAL</div>
      </footer>

      <a href={waLink(s.whatsapp, `Hello ${name}, I would like to know more about your products.`)} className="fab fab--wa" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
        <span className="fab__icon"><Icon name="whatsapp" size={28} /></span><span className="fab__label">Chat with us</span>
      </a>
      {s.instagram_url && (
        <a href={s.instagram_url} className="fab fab--ig" target="_blank" rel="noopener" aria-label="Follow us on Instagram">
          <span className="fab__icon"><Icon name="instagram" size={28} /></span>
        </a>
      )}
      <button className="back-to-top" id="backToTop" aria-label="Back to top"><Icon name="up" size={20} /></button>
    </>
  );
}
