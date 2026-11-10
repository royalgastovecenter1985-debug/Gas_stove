import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Picture } from '@/components/Picture';
import { JsonLd } from '@/components/site/JsonLd';
import { ProductCard } from '@/components/site/ProductCard';
import { Paragraphs } from '@/components/site/RichText';
import { getProductBySlug, productSize, searchProducts } from '@/lib/data';
import { excerpt, imgSrc, telLink, waLink, waNumber, waProductMessage } from '@/lib/format';
import { webpOf } from '@/lib/picture';
import { siteUrl } from '@/lib/request';
import { getSettings, phones } from '@/lib/settings';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: 'Page Not Found', robots: { index: false } };
  return {
    title: `${p.name} — ${p.category_name}`,
    description: excerpt(`${p.short_description ?? ''} ${p.description ?? ''}`, 158),
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: 'website', images: [imgSrc(p.images[0] ?? 'assets/img/og-image.jpg')] },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const s = await getSettings();
  const wa = waNumber(s.whatsapp);
  const images = product.images.length ? product.images : [product.image ?? 'assets/img/placeholder.svg'];
  const size = productSize(product);

  let related = await searchProducts({ categoryId: product.category_id, limit: 4, excludeId: product.id });
  if (related.length < 4) {
    const ids = new Set(related.map((r) => r.id));
    const more = (await searchProducts({ featuredOnly: true, limit: 12, excludeId: product.id })).filter((p) => !ids.has(p.id));
    related = [...related, ...more].slice(0, 4);
  }

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: excerpt(product.description, 300),
      image: images.map((i) => siteUrl(i)),
      category: product.category_name,
      brand: { '@type': 'Brand', name: s.site_name },
      additionalProperty: Object.entries(product.specs).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
        { '@type': 'ListItem', position: 2, name: product.category_name, item: siteUrl(`products/${product.category_slug}`) },
        { '@type': 'ListItem', position: 3, name: product.name, item: siteUrl(`product/${product.slug}`) },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <section className="section" style={{ paddingTop: 'clamp(20px, 3vw, 32px)' }}>
        <div className="container">
          <ol className="breadcrumb">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/products">Products</Link></li>
            <li><Link href={`/products/${product.category_slug}`}>{product.category_name}</Link></li>
            <li>{product.name}</li>
          </ol>

          <div className="pd">
            <div className="pd__gallery reveal">
              <a href={imgSrc(images[0])} className="gallery__main" id="galleryMain" data-lightbox="product" data-caption={product.name}>
                <Picture path={images[0]} alt={product.name} lazy={false} w={1000} h={750} sizes="(min-width:1024px) 55vw, 100vw" />
              </a>
              {images.length > 1 && (
                <div className="gallery__thumbs">
                  {images.map((img, k) => (
                    <button key={img} type="button" className={`gallery__thumb${k === 0 ? ' is-active' : ''}`} data-full={imgSrc(img)} data-webp={webpOf(img)} aria-label={`Show image ${k + 1}`}>
                      <Picture path={img} w={500} h={375} sizes="88px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pd__info">
              <Link href={`/products/${product.category_slug}`} className="pd__cat reveal">{product.category_name}</Link>
              <h1 className="pd__title reveal">{product.name}</h1>
              <p className="pd__lead reveal">{product.short_description}</p>
              <p className="reveal"><span className="pd__size"><Icon name="ruler" size={16} /> {size ? `${size} inches` : 'Size as per requirement'}</span></p>

              <div className="pd__actions reveal">
                <button type="button" className="btn btn--dark" data-quick-inquiry data-product={product.name}>Send inquiry <Icon name="arrow" size={18} /></button>
                <a href={waLink(wa, waProductMessage(product.name))} className="btn btn--wa" target="_blank" rel="noopener"><Icon name="whatsapp" size={18} /> WhatsApp</a>
                {phones(s)[0] && <a href={telLink(phones(s)[0])} className="btn btn--outline"><Icon name="phone" size={18} /> Call</a>}
              </div>

              <ul className="pd__perks reveal">
                <li><Icon name="tag" size={18} /> Wholesale pricing</li>
                <li><Icon name="ruler" size={18} /> Custom sizes on request</li>
                <li><Icon name="truck" size={18} /> Delivery across Gujarat</li>
                <li><Icon name="support" size={18} /> After-sales service</li>
              </ul>
            </div>
          </div>

          <div className="pd-info">
            <div className="reveal">
              <h2>Overview</h2>
              <div className="prose"><Paragraphs text={product.description} /></div>
            </div>
            {Object.keys(product.specs).length > 0 && (
              <div className="reveal" style={{ '--d': '100ms' } as React.CSSProperties}>
                <h2>Specifications</h2>
                <table className="specs">
                  <tbody>
                    {Object.entries(product.specs).map(([k, v]) => (
                      <tr key={k}><th scope="row">{k}</th><td>{typeof v === 'string' || typeof v === 'number' ? String(v) : JSON.stringify(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <div className="head">
              <h2 className="head__title reveal">You may also need</h2>
              <Link href={`/products/${product.category_slug}`} className="link-arrow reveal">More {product.category_name} <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="product-grid product-grid--4">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} wa={wa} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
