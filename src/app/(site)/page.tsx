import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';
import { Icon, Stars } from '@/components/Icon';
import { Picture } from '@/components/Picture';
import { InquiryForm } from '@/components/site/InquiryForm';
import { ProductCard } from '@/components/site/ProductCard';
import {
  catalogCounts, getCategories, getCertificates, getProductBySlug, getReels, getTestimonials, searchProducts, type Product,
} from '@/lib/data';
import { imgSrc, instagramCleanUrl, telLink, waLink, waNumber } from '@/lib/format';
import { clientList, getSettings, isOpenNow, phones } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const counts = await catalogCounts();
  return {
    description: `Royal Gas Stove Center, Kalupur, Ahmedabad — home of the SOLID™ brand. ${counts.products}+ commercial kitchen products: cooking ranges, dom burners, puffer & dhosa bhattis, SS tables, sinks, ovens, Ben Marie and shawarma machines.`,
    alternates: { canonical: '/' },
  };
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties;

export default async function HomePage() {
  const [s, categories, featured, testimonials, reels, certs, counts] = await Promise.all([
    getSettings(), getCategories(true), searchProducts({ featuredOnly: true, limit: 12 }), getTestimonials(), getReels(), getCertificates(1), catalogCounts(),
  ]);
  const wa = waNumber(s.whatsapp);
  const name = s.site_name || 'Royal Gas Stove Center';
  const certificate = certs[0] ?? null;
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const segments = clientList(s);

  const fromCats = async (slugs: string[], limit = 8): Promise<Product[]> => {
    const lists = await Promise.all(
      slugs.filter((x) => catBySlug.has(x)).map((x) => searchProducts({ categoryId: catBySlug.get(x)!.id, limit: 4 })),
    );
    return lists.flat().sort((a, b) => b.is_featured - a.is_featured).slice(0, limit);
  };
  const [stoves, bhattis, steel, heroBest] = await Promise.all([
    fromCats(['cooking-range', 'single-dom-burner', 'double-dom-burner']),
    fromCats(['puffer-bhatti', 'dhosa-bhatti', 'round-rumali-stove']),
    fromCats(['table', 'sink', 'transport-trolley', 'ben-marie']),
    getProductBySlug('three-burner-range-24x72x30'),
  ]);
  const tabs = ([
    ['best', 'Best sellers', featured.slice(0, 8)],
    ['stoves', 'Stoves & ranges', stoves],
    ['bhattis', 'Bhattis', bhattis],
    ['steel', 'SS fabrication', steel],
  ] as const).filter((t) => t[2].length > 0);

  const heroProduct = heroBest ?? featured[0] ?? null;
  const heroCats = categories.slice(0, 8);
  const openNow = isOpenNow(s);
  const bento = ['cooking-range', 'puffer-bhatti', 'shawarma-machine', 'ben-marie', 'sink'].map((x) => catBySlug.get(x)).filter((c) => !!c);
  const ratingLabel = s.google_review_count ? `${s.google_review_count} Google reviews` : 'Google rating';

  return (
    <>
      {/* HERO */}
      <section className="hero2">
        <div className="container hero2__grid">
          <div className="hero2__copy">
            <p className="hero2__status h-in" style={css({ '--i': 0 })}>
              <span className={`hero2__pulse${openNow ? '' : ' is-closed'}`} />
              {openNow ? 'Open now' : 'Closed now'} · {s.business_hours} · Kalupur, Ahmedabad
            </p>
            <h1 className="hero2__title h-in" style={css({ '--i': 1 })}>
              Commercial kitchen equipment,{' '}
              <span className="hero2__mark">built to last.<svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 10 C 60 2, 120 2, 160 7 S 250 13, 298 4" /></svg></span>
            </h1>
            <p className="hero2__lead h-in" style={css({ '--i': 2 })}>Cooking ranges, dom burners, bhattis and stainless-steel counters — sold wholesale from our Kalupur showroom, fabricated to your size, and serviced by the same team.</p>
            <div className="hero2__cta h-in" style={css({ '--i': 3 })}>
              <a href="/contact#inquiry" className="btn btn--dark" data-quick-inquiry>Get a quote <Icon name="arrow" size={18} /></a>
              <a href={waLink(wa, `Hello ${name}, I would like a quote.`)} className="btn btn--wa-outline" target="_blank" rel="noopener"><Icon name="whatsapp" size={18} /> WhatsApp us</a>
            </div>
            <ul className="hero2__proof h-in" style={css({ '--i': 4 })}>
              {s.google_rating && (
                <li><a href={s.google_url || '#'} target="_blank" rel="noopener"><strong>{s.google_rating} <span className="stars"><Icon name="star-fill" size={14} /></span></strong><span>{ratingLabel}</span></a></li>
              )}
              <li><strong>SOLID™</strong><span>Registered brand</span></li>
              <li><strong>{counts.products}+</strong><span>Products</span></li>
            </ul>
          </div>

          <div className="hero2__visual" data-parallax>
            <div className="hero2__video h-in" style={css({ '--i': 1 })} data-depth="0.02">
              <video src="/assets/img/brand/hero-shop.mp4" poster="/assets/img/brand/shopfront.jpg" muted loop playsInline autoPlay preload="metadata" aria-label={`${name} showroom, Kalupur Tower Road`} />
              <span className="hero2__video-tag"><Icon name="pin" size={14} /> Our showroom</span>
            </div>
            {heroProduct && (
              <Link href={`/product/${heroProduct.slug}`} className="hero2__product h-in" style={css({ '--i': 3 })} data-depth="0.06">
                <span className="hero2__product-img"><Picture path={heroProduct.image} alt={heroProduct.name} lazy={false} w={500} h={375} sizes="220px" /></span>
                <span className="hero2__product-body">
                  <small>Best seller</small>
                  <strong>{heroProduct.name}</strong>
                  <span className="link-arrow">View product <Icon name="arrow" size={14} /></span>
                </span>
              </Link>
            )}
            <div className="hero2__chip hero2__chip--tm h-in" style={css({ '--i': 4 })} data-depth="0.09"><Icon name="shield" size={16} /> SOLID™ · Govt. registered 2012</div>
            <div className="hero2__chip hero2__chip--del h-in" style={css({ '--i': 5 })} data-depth="0.04"><Icon name="truck" size={16} /> Delivery &amp; install across Gujarat</div>
          </div>
        </div>

        <nav className="container hero2__cats h-in" style={css({ '--i': 5 })} aria-label="Popular categories">
          {heroCats.map((c) => (
            <Link key={c.id} href={`/products/${c.slug}`} className="hero2__cat">
              <span className="hero2__cat-img"><Picture path={c.image} w={500} h={375} sizes="56px" /></span>
              <span>{c.name}</span>
            </Link>
          ))}
          <Link href="/products" className="hero2__cat hero2__cat--all"><span>All {counts.categories} categories</span> <Icon name="arrow" size={16} /></Link>
        </nav>
      </section>

      {/* USP STRIP */}
      <section className="usp" aria-label="Why buy from us">
        <div className="container usp__row">
          <div className="usp__item"><Icon name="tag" size={22} /><span><strong>Wholesale prices</strong>Single piece or bulk</span></div>
          <div className="usp__item"><Icon name="ruler" size={22} /><span><strong>Made to measure</strong>Your size, your layout</span></div>
          <div className="usp__item"><Icon name="truck" size={22} /><span><strong>Delivery &amp; install</strong>Across Gujarat</span></div>
          <div className="usp__item"><Icon name="support" size={22} /><span><strong>After-sales service</strong>Spares &amp; repairs</span></div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="section">
        <div className="container">
          <div className="head">
            <div>
              <h2 className="head__title reveal">Shop by category</h2>
              <p className="head__sub reveal">{counts.products} products across {counts.categories} categories — shown with real photos of the equipment we supply.</p>
            </div>
            <div className="rail-nav reveal" data-rail-nav="catRail">
              <button className="round-btn" data-dir="-1" aria-label="Scroll left"><Icon name="left" size={20} /></button>
              <button className="round-btn" data-dir="1" aria-label="Scroll right"><Icon name="right" size={20} /></button>
            </div>
          </div>
          <div className="rail cat-rail" id="catRail">
            {categories.map((c, i) => (
              <Link key={c.id} href={`/products/${c.slug}`} className="cat reveal" style={css({ '--d': `${Math.min(i, 6) * 50}ms` })}>
                <span className="cat__media"><Picture path={c.image} alt={c.name} w={500} h={375} sizes="200px" /></span>
                <span className="cat__name">{c.name}</span>
                <span className="cat__count">{c.product_count} models</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO */}
      {bento.length >= 5 && (
        <section className="section section--tight">
          <div className="container">
            <div className="bento">
              {bento.map((c, k) => (
                <Link key={c.id} href={`/products/${c.slug}`} className={`bento__tile bento__tile--${k} reveal`} style={css({ '--d': `${k * 80}ms` })}>
                  <span className="bento__copy">
                    <span className="bento__count">{c.product_count} models</span>
                    <span className="bento__title">{c.name}</span>
                    {k === 0 && <span className="bento__text">{c.tagline}</span>}
                    <span className="bento__link">Explore <Icon name="arrow" size={16} /></span>
                  </span>
                  <span className="bento__media"><Picture path={c.image} w={1000} h={750} sizes={k === 0 ? '(min-width:1024px) 50vw, 100vw' : '(min-width:1024px) 25vw, 50vw'} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TABBED PRODUCTS */}
      {tabs.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="head">
              <h2 className="head__title reveal">Popular in our showroom</h2>
              <Link href="/products" className="link-arrow reveal">View all products <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="tabs reveal" role="tablist" data-tabs>
              {tabs.map(([key, label], i) => (
                <button key={key} className={`tabs__btn${i === 0 ? ' is-active' : ''}`} role="tab" aria-selected={i === 0} aria-controls={`tab-${key}`} id={`tabbtn-${key}`}>{label}</button>
              ))}
              <span className="tabs__ink" aria-hidden="true" />
            </div>
            {tabs.map(([key, , items], i) => (
              <div key={key} className={`product-grid product-grid--4 tab-panel${i === 0 ? ' is-active' : ''}`} role="tabpanel" id={`tab-${key}`} aria-labelledby={`tabbtn-${key}`} hidden={i !== 0}>
                {items.map((p, k) => <ProductCard key={p.id} product={p} index={k} wa={wa} />)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BRAND STORY: SOLID */}
      <section className="brand-story">
        <div className="container brand-story__grid">
          <div className="brand-story__copy">
            <div className="brand-story__mark reveal"><img src="/assets/img/brand/solid.png" alt="SOLID" width={200} height={91} loading="lazy" /></div>
            <h2 className="brand-story__title reveal">Our own brand. Registered with the Government of India since 2012.</h2>
            <p className="reveal">{name} has been supplying and servicing commercial kitchen equipment from Kalupur Tower Road, in the heart of Ahmedabad’s trading district. Our equipment is sold under <strong>SOLID™</strong> — a trade mark registered for kitchen equipment and commercial cooking equipment.</p>
            <p className="reveal">That name is a promise we have to keep on every burner, bhatti and steel table that leaves the workshop.</p>
            <div className="stat-tiles">
              <div className="stat-tile reveal"><strong data-count={counts.products}>0</strong><span>Products in our catalogue</span></div>
              <div className="stat-tile reveal" style={css({ '--d': '80ms' })}><strong data-count={counts.categories}>0</strong><span>Equipment categories</span></div>
              <div className="stat-tile reveal" style={css({ '--d': '160ms' })}><strong>2012</strong><span>SOLID™ trade mark registered</span></div>
              {s.stat_years ? (
                <div className="stat-tile reveal" style={css({ '--d': '240ms' })}><strong><span data-count={parseInt(s.stat_years, 10)}>0</span>+</strong><span>Years in business</span></div>
              ) : s.stat_clients ? (
                <div className="stat-tile reveal" style={css({ '--d': '240ms' })}><strong><span data-count={parseInt(s.stat_clients, 10)}>0</span>+</strong><span>Kitchens supplied</span></div>
              ) : (
                <div className="stat-tile reveal" style={css({ '--d': '240ms' })}><strong>{phones(s).length}</strong><span>Direct phone lines</span></div>
              )}
            </div>
            <Link href="/about" className="btn btn--gold reveal">Our story <Icon name="arrow" size={18} /></Link>
          </div>
          {certificate && (
            <a href={imgSrc(certificate.image)} className="brand-story__cert reveal reveal--right" data-lightbox="tm" data-caption={certificate.title}>
              <Picture path={certificate.image} alt={certificate.title} w={550} h={765} />
              <span className="brand-story__cert-tag"><Icon name="shield" size={16} /> Trade Marks Registry, Govt. of India</span>
            </a>
          )}
        </div>
      </section>

      {/* KITCHEN PLANNING */}
      <section className="section">
        <div className="container plan">
          <a href="/assets/img/brand/kitchen-layout.jpg" className="plan__media reveal" data-lightbox="kitchen-map" data-caption="Commercial kitchen layout — cooking, washing, storage and service zones">
            <Picture path="assets/img/brand/kitchen-layout.jpg" w={1448} h={1086} sizes="(min-width:1024px) 55vw, 100vw"
              alt="Commercial kitchen floor plan: deep freezer, vegetable cutting table, dosa plate station, 3 burner gas range under exhaust hood, hand wash sink, single and double sinks, dishwasher, work table, pickup table with warmer, coolers, racks, store and main entrance" />
            <span className="plan__scan" aria-hidden="true" />
          </a>
          <div className="plan__copy">
            <h2 className="head__title reveal">Setting up a new kitchen?</h2>
            <p className="head__sub reveal">Send us your space and menu. We handle the rest.</p>
            <ol className="steps">
              <li className="reveal"><span>01</span><div><strong>Measure &amp; plan</strong><p>We visit or work from your drawing and plan each station.</p></div></li>
              <li className="reveal" style={css({ '--d': '80ms' })}><span>02</span><div><strong>Clear quotation</strong><p>An itemised quote with sizes, materials and delivery dates.</p></div></li>
              <li className="reveal" style={css({ '--d': '160ms' })}><span>03</span><div><strong>Fabrication</strong><p>Built in our workshop or picked from ready stock.</p></div></li>
              <li className="reveal" style={css({ '--d': '240ms' })}><span>04</span><div><strong>Delivery &amp; install</strong><p>Delivered, installed and tested — then we stay on call.</p></div></li>
            </ol>
            <button type="button" className="btn btn--dark reveal" data-quick-inquiry data-product="Complete kitchen setup">Plan my kitchen <Icon name="arrow" size={18} /></button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="section section--soft testimonials">
          <div className="container testimonials__grid">
            <div className="testimonials__intro">
              <h2 className="head__title reveal">What kitchen owners tell us</h2>
              {s.google_rating && (
                <div className="rating-summary reveal">
                  <strong>{s.google_rating}</strong>
                  <span><span className="stars"><Stars count={5} size={18} /></span><small>{s.google_review_count ? `${s.google_review_count} Google reviews` : 'on Google'}</small></span>
                </div>
              )}
              <p className="head__sub reveal">Real feedback from restaurants, caterers and cafés we have supplied. Bought from us? We would love to hear from you.</p>
              <div className="testimonials__ctrl reveal">
                <button className="round-btn" data-tm-prev aria-label="Previous review"><Icon name="left" size={20} /></button>
                <span className="tm-count"><span data-tm-current>01</span> / {String(testimonials.length).padStart(2, '0')}</span>
                <button className="round-btn" data-tm-next aria-label="Next review"><Icon name="right" size={20} /></button>
              </div>
              {s.google_url && <a href={s.google_url} className="link-arrow reveal" target="_blank" rel="noopener"><Icon name="google" size={16} /> Write a review on Google</a>}
            </div>
            <div className="tm" data-tm>
              <div className="tm__track">
                {testimonials.map((t, k) => (
                  <figure key={t.id} className={`tm__card${k === 0 ? ' is-active' : ''}`} data-index={k}>
                    <div className="tm__top">
                      <span className="stars" aria-label={`${t.rating} out of 5`}><Stars count={Number(t.rating)} /></span>
                      {t.product && <span className="tm__product">{t.product}</span>}
                    </div>
                    <blockquote>“{t.message}”</blockquote>
                    <figcaption>
                      <span className="avatar">{t.name.slice(0, 1).toUpperCase()}</span>
                      <span><strong>{t.name}</strong><small className="tm__source">{/google/i.test(t.designation ?? '') && <Icon name="google" size={13} />}{t.designation}</small></span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="tm__progress"><span /></div>
            </div>
          </div>
        </section>
      )}

      {/* INSTAGRAM REELS */}
      {reels.length > 0 && (
        <section className="section reels-section">
          <div className="container">
            <div className="head">
              <div>
                <h2 className="head__title reveal">Royal Reels</h2>
                {s.instagram_handle && <p className="head__sub reveal">@{s.instagram_handle} — fresh from the workshop floor</p>}
              </div>
              <div className="reels-head__actions reveal">
                {s.instagram_url && <a href={s.instagram_url} className="pill-btn" target="_blank" rel="noopener"><Icon name="instagram" size={16} /> Follow on Instagram</a>}
                <div className="rail-nav hide-sm" data-rail-nav="reelRail">
                  <button className="round-btn" data-dir="-1" aria-label="Scroll reels left"><Icon name="left" size={20} /></button>
                  <button className="round-btn" data-dir="1" aria-label="Scroll reels right"><Icon name="right" size={20} /></button>
                </div>
              </div>
            </div>
            <div className="rail reels" id="reelRail">
              {reels.map((r, k) => {
                const link = instagramCleanUrl(r.link) || r.link || s.instagram_url;
                const hasVideo = !!r.video;
                const isCover = !r.poster.startsWith('assets/img/products/');
                const cls = 'reel' + (hasVideo ? ' reel--video' : isCover ? ' reel--cover' : '');
                return (
                  <article key={r.id} className={`${cls} reveal`} style={css({ '--d': `${Math.min(k, 5) * 70}ms` })}>
                    <a href={link} className="reel__link" target="_blank" rel="noopener" title={r.title} aria-label={`Watch on Instagram: ${r.title}`}>
                      {hasVideo ? (
                        <video className="reel__video" data-src={imgSrc(r.video)} poster={imgSrc(r.poster)} muted loop playsInline preload="none" aria-hidden="true" />
                      ) : isCover ? (
                        <Picture path={r.poster} className="reel__img" w={360} h={640} />
                      ) : (
                        <Picture path={r.poster} className="reel__img" w={500} h={375} sizes="300px" />
                      )}
                    </a>
                    <div className="reel__brand"><span className="reel__dot" />ROYAL GAS STOVE</div>
                    <div className="reel__actions">
                      <button type="button" className="reel__btn" data-like aria-pressed="false" aria-label="Like"><Icon name="heart" size={18} /></button>
                      <button type="button" className="reel__btn" data-share={link} data-title={r.title} aria-label="Share"><Icon name="share" size={18} /></button>
                    </div>
                    {hasVideo && <span className="reel__loop" aria-hidden="true"><Icon name="loop" size={18} /></span>}
                    <span className="reel__badge" aria-hidden="true"><img src={imgSrc(s.logo)} alt="" width={56} height={56} loading="lazy" /></span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* WHO WE SERVE TICKER */}
      {segments.length > 0 && (
        <section className="ticker" aria-label="Who we serve">
          <div className="ticker__track">
            {[0, 1].map((k) => segments.map((x, i) => (
              <Fragment key={`${k}-${i}`}>
                <span aria-hidden={k ? true : undefined}>{x}</span><i aria-hidden="true">✦</i>
              </Fragment>
            )))}
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section className="section" id="inquiry">
        <div className="container contact-block">
          <div className="contact-block__form reveal">
            <h2 className="head__title">Tell us what you’re cooking</h2>
            <p className="head__sub">Share the product, size and quantity — we reply with a clear quotation.</p>
            <InquiryForm formId="home" source="home" productOptions={categories.map((c) => c.name)} waNumber={wa} />
          </div>
          <aside className="contact-block__side reveal" style={css({ '--d': '120ms' })}>
            <div className="contact-list">
              <a href={waLink(wa, `Hello ${name}, I have an inquiry.`)} target="_blank" rel="noopener" className="contact-list__item contact-list__item--wa"><Icon name="whatsapp" size={22} /><span><small>WhatsApp — fastest reply</small>+{wa}</span></a>
              {phones(s).map((p) => (
                <a key={p} href={telLink(p)} className="contact-list__item"><Icon name="phone" size={20} /><span><small>Call</small>{p}</span></a>
              ))}
              <div className="contact-list__item"><Icon name="pin" size={20} /><span><small>Showroom</small>{s.address}</span></div>
            </div>
            <div className="map-mini">
              <iframe title={`${name} on Google Maps`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(s.map_lat)},${encodeURIComponent(s.map_lng)}&z=16&output=embed`} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
