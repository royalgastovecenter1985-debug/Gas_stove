import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryIntro } from '@/components/site/CategoryIntro';
import { JsonLd } from '@/components/site/JsonLd';
import { ProductCard } from '@/components/site/ProductCard';
import { ProductsShell } from '@/components/site/ProductsShell';
import { catalogCounts, getCategories, getCategoryBySlug, searchProducts } from '@/lib/data';
import { excerpt, waLink, waNumber } from '@/lib/format';
import { siteUrl } from '@/lib/request';
import { getSettings } from '@/lib/settings';

const DEFAULT_SUB = 'Commercial kitchen equipment — supplied wholesale and fabricated to order.';

export function cleanQuery(raw: string | string[] | undefined): string {
  return String(Array.isArray(raw) ? raw[0] : raw ?? '').trim().slice(0, 80);
}

export async function productsMetadata(slug: string | null, q: string): Promise<Metadata> {
  const robots = q ? { index: false, follow: true } : undefined;
  if (slug) {
    const c = await getCategoryBySlug(slug);
    if (!c) return {};
    return {
      title: `${c.name} — Wholesale Supplier in Ahmedabad`,
      description: excerpt(`${c.tagline}. ${c.description}`, 158),
      alternates: { canonical: `/products/${c.slug}` },
      openGraph: c.image ? { images: ['/' + c.image] } : undefined,
      robots,
    };
  }
  const total = (await catalogCounts()).products;
  return {
    title: 'Commercial Kitchen Equipment',
    description: `Browse ${total} commercial kitchen products from Royal Gas Stove Center, Ahmedabad: cooking ranges, dom burners, puffer & dhosa bhattis, SS tables, sinks, trolleys, grillers, ovens, Ben Marie and shawarma machines.`,
    alternates: { canonical: '/products' },
    robots,
  };
}

export async function ProductsPage({ slug, q }: { slug: string | null; q: string }) {
  const [s, categories, counts] = await Promise.all([getSettings(), getCategories(true), catalogCounts()]);
  const category = slug ? await getCategoryBySlug(slug) : null;
  if (slug && !category) notFound();
  const products = await searchProducts({ categoryId: category?.id ?? null, q, limit: 500 });
  const wa = waNumber(s.whatsapp);
  const title = category?.name ?? 'All products';

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
      { '@type': 'ListItem', position: 2, name: 'Products', item: siteUrl('products') },
      ...(category ? [{ '@type': 'ListItem', position: 3, name: category.name, item: siteUrl(`products/${category.slug}`) }] : []),
    ],
  };

  return (
    <>
      <JsonLd data={crumbs} />
      <section className="page-head">
        <div className="container">
          <ol className="breadcrumb">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/products">Products</Link></li>
            <li id="crumbCurrent">{title}</li>
          </ol>
          <h1 id="productsHeading">{title}</h1>
          <p id="productsSub">{category?.tagline ?? DEFAULT_SUB}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'clamp(24px, 4vw, 40px)' }}>
        <ProductsShell
          category={category?.slug ?? ''}
          initialQ={q}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c.product_count ?? 0 }))}
          total={counts.products}
          resultCount={products.length}
          customSizeWa={waLink(wa, `Hello ${s.site_name}, I need a custom-size product.`)}
          intro={category ? <CategoryIntro category={category} wa={wa} /> : null}
        >
          {products.length > 0 ? (
            products.map((p, i) => <ProductCard key={p.id} product={p} index={i} wa={wa} />)
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p className="muted">Try a different search — or tell us what you need. We fabricate to order.</p>
              <button className="btn btn--dark" data-quick-inquiry data-product={q || category?.name || ''}>Ask for it</button>
            </div>
          )}
        </ProductsShell>
      </section>
    </>
  );
}
