import { notFound } from 'next/navigation';
import { ProductForm, type ProductFormData } from '@/components/admin/ProductForm';
import { requireAdmin } from '@/lib/auth';
import { parseJson, query, queryOne } from '@/lib/db';
import { smallOf } from '@/lib/picture';

export const metadata = { title: 'Edit product' };

/** /admin/products/new and /admin/products/{id} */
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const raw = (await params).id;
  const id = raw === 'new' ? 0 : parseInt(raw, 10);
  if (raw !== 'new' && !(id > 0)) notFound();

  const categories = await query<{ id: number; name: string }>('SELECT id, name FROM categories ORDER BY sort_order, name');
  let product: ProductFormData = {
    id: 0, category_id: 0, name: '', slug: '', short_description: '', description: '', specs: [], images: [],
    is_featured: false, is_active: true, sort_order: 0,
  };
  if (id) {
    const row = await queryOne<Record<string, unknown>>('SELECT * FROM products WHERE id = ?', [id]);
    if (!row) notFound();
    const specs = parseJson<Record<string, string> | unknown[]>(row.specs, {});
    product = {
      id,
      category_id: Number(row.category_id),
      name: String(row.name ?? ''),
      slug: String(row.slug ?? ''),
      short_description: String(row.short_description ?? ''),
      description: String(row.description ?? ''),
      specs: Array.isArray(specs) ? [] : Object.entries(specs).map(([k, v]) => [k, String(v)] as [string, string]),
      images: parseJson<string[]>(row.images, []).map((path) => ({ path, url: smallOf(path) })),
      is_featured: !!Number(row.is_featured),
      is_active: !!Number(row.is_active),
      sort_order: Number(row.sort_order ?? 0),
    };
  }
  return <ProductForm product={product} categories={categories} />;
}
