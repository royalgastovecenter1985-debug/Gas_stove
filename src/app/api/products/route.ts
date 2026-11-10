import { NextResponse, type NextRequest } from 'next/server';
import { getCategoryBySlug, productSize, searchProducts } from '@/lib/data';
import { smallOf } from '@/lib/picture';

/** GET /api/products?q=…&category=slug — compact JSON for the header search suggestions. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 80);
  const cat = req.nextUrl.searchParams.get('category') || '';
  const category = /^[a-z0-9-]+$/.test(cat) ? await getCategoryBySlug(cat) : null;
  const products = await searchProducts({ categoryId: category?.id ?? null, q, limit: 200 });
  const items = products.slice(0, 6).map((p) => ({
    name: p.name,
    url: `/product/${p.slug}`,
    image: smallOf(p.image),
    category: p.category_name,
    size: productSize(p),
  }));
  return NextResponse.json({ ok: true, count: products.length, items }, { headers: { 'Cache-Control': 'no-store' } });
}
