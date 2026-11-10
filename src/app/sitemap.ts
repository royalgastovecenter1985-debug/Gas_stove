import type { MetadataRoute } from 'next';
import { getCategories, searchProducts } from '@/lib/data';
import { siteUrl } from '@/lib/request';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, products] = await Promise.all([getCategories(), searchProducts({ limit: 500 })]);
  return [
    ...([['', 1], ['about', 0.8], ['products', 0.9], ['certificates', 0.6], ['contact', 0.8]] as const).map(([p, priority]) => ({ url: siteUrl(p), priority })),
    ...cats.map((c) => ({ url: siteUrl(`products/${c.slug}`), priority: 0.8 })),
    ...products.map((p) => ({ url: siteUrl(`product/${p.slug}`), priority: 0.7 })),
  ];
}
