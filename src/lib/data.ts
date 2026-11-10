import 'server-only';
import { cache } from 'react';
import { likeTerm, parseJson, query, queryOne } from './db';

export interface Category {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image: string | null;
  sort_order: number;
  is_active: number;
  product_count?: number;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  specs: Record<string, string>;
  images: string[];
  image: string | null;
  is_featured: number;
  is_active: number;
  sort_order: number;
  category_name: string;
  category_slug: string;
  category_image: string | null;
}

export interface Certificate {
  id: number;
  title: string;
  issued_by: string | null;
  year: string | null;
  image: string;
  sort_order: number;
  is_active: number;
}

export interface Testimonial {
  id: number;
  name: string;
  designation: string | null;
  message: string;
  product: string | null;
  rating: number;
  sort_order: number;
  is_active: number;
}

export interface Reel {
  id: number;
  title: string;
  link: string | null;
  poster: string;
  video: string | null;
  sort_order: number;
  is_active: number;
}

type ProductRow = Omit<Product, 'specs' | 'images' | 'image'> & { specs: unknown; images: unknown };

export function hydrateProduct(p: ProductRow): Product {
  const specs = parseJson<Record<string, string> | unknown[]>(p.specs, {});
  const images = parseJson<string[]>(p.images, []);
  return {
    ...p,
    specs: Array.isArray(specs) ? {} : (specs as Record<string, string>),
    images: Array.isArray(images) ? images.filter((x) => typeof x === 'string') : [],
    image: (Array.isArray(images) && images[0]) || p.category_image || null,
  };
}

export const getCategories = cache(async (withCounts = false): Promise<Category[]> => {
  const sql = withCounts
    ? `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c WHERE c.is_active = 1 ORDER BY c.sort_order, c.name`
    : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name';
  const rows = await query<Category>(sql);
  return rows.map((r) => ({ ...r, product_count: r.product_count != null ? Number(r.product_count) : undefined }));
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  return queryOne<Category>('SELECT * FROM categories WHERE slug = ? AND is_active = 1', [slug]);
});

const PRODUCT_SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug, c.image AS category_image
  FROM products p JOIN categories c ON c.id = p.category_id`;

export async function searchProducts(opts: {
  categoryId?: number | null;
  q?: string;
  featuredOnly?: boolean;
  limit?: number;
  excludeId?: number;
} = {}): Promise<Product[]> {
  const where = ['p.is_active = 1', 'c.is_active = 1'];
  const args: unknown[] = [];
  if (opts.categoryId) {
    where.push('p.category_id = ?');
    args.push(opts.categoryId);
  }
  if (opts.q) {
    where.push('(p.name ILIKE ? OR p.short_description ILIKE ? OR c.name ILIKE ?)');
    const like = likeTerm(opts.q);
    args.push(like, like, like);
  }
  if (opts.featuredOnly) where.push('p.is_featured = 1');
  if (opts.excludeId) {
    where.push('p.id <> ?');
    args.push(opts.excludeId);
  }
  const limit = Math.max(1, Math.min(opts.limit ?? 60, 500));
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} WHERE ${where.join(' AND ')} ORDER BY c.sort_order, p.sort_order, p.name LIMIT ${limit}`,
    args,
  );
  return rows.map(hydrateProduct);
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const row = await queryOne<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.is_active = 1`, [slug]);
  return row ? hydrateProduct(row) : null;
});

export const getCertificates = cache(async (limit = 100): Promise<Certificate[]> => {
  return query<Certificate>(`SELECT * FROM certificates WHERE is_active = 1 ORDER BY sort_order, id LIMIT ${Math.trunc(limit)}`);
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  return query<Testimonial>('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order, id');
});

export const getReels = cache(async (): Promise<Reel[]> => {
  return query<Reel>('SELECT * FROM reels WHERE is_active = 1 ORDER BY sort_order, id LIMIT 20');
});

export const catalogCounts = cache(async (): Promise<{ products: number; categories: number }> => {
  const row = await queryOne<{ products: number; categories: number }>(
    `SELECT (SELECT COUNT(*) FROM products p JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1 AND c.is_active = 1) AS products,
            (SELECT COUNT(*) FROM categories WHERE is_active = 1) AS categories`,
  );
  return { products: Number(row?.products ?? 0), categories: Number(row?.categories ?? 0) };
});

export function productSize(p: Pick<Product, 'specs'>): string {
  return String(p.specs?.['Size (inches)'] ?? '');
}
