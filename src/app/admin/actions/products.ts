'use server';

import { redirect } from 'next/navigation';
import { int, str, uniqueSlug, withFlash, type FormState } from '@/lib/admin';
import { requireAdmin } from '@/lib/auth';
import { execute, parseJson, queryOne } from '@/lib/db';
import { deleteUpload, isFile, saveImage, UploadError } from '@/lib/uploads';

const MAX_PRODUCT_IMAGES = 15;

/**
 * Create / update a product. Images arrive as:
 *   order     JSON list, e.g. ["assets/img/products/a.jpg", "new:0", "new:1"] — final order, first = main image
 *   newImages the uploaded files referenced by "new:<index>"
 * Existing images left out of `order` are deleted from disk after saving.
 */
export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(fd, 'id');
  const name = str(fd, 'name', 180);
  const categoryId = int(fd, 'category_id');
  const errors: string[] = [];

  if (!name) errors.push('Product name is required.');
  const cat = await queryOne('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!cat) errors.push('Please choose a category.');

  const existing = id
    ? await queryOne<{ images: unknown }>('SELECT images FROM products WHERE id = ?', [id])
    : null;
  if (id && !existing) return { error: 'This product no longer exists.' };
  const oldImages = parseJson<string[]>(existing?.images, []);

  // Specifications: parallel spec_key[] / spec_value[] fields
  const keys = fd.getAll('spec_key').map((x) => String(x).trim());
  const vals = fd.getAll('spec_value').map((x) => String(x).trim());
  const specs: Record<string, string> = {};
  keys.forEach((k, i) => { if (k && vals[i]) specs[k.slice(0, 80)] = vals[i].slice(0, 255); });

  let order: string[] = [];
  try { order = JSON.parse(str(fd, 'order', 20_000) || '[]'); } catch { order = []; }
  const files = fd.getAll('newImages').filter(isFile);
  if (errors.length) return { errors };

  // Save new uploads; on any failure remove what was saved and report.
  const saved: Record<string, string> = {};
  try {
    for (const token of order) {
      const m = /^new:(\d+)$/.exec(token);
      if (m && files[+m[1]]) saved[token] = await saveImage(files[+m[1]], 'products');
    }
  } catch (e) {
    await Promise.all(Object.values(saved).map(deleteUpload));
    return { error: e instanceof UploadError ? e.message : 'Could not save the images. Please try again.' };
  }

  const images = order
    .map((t) => (t.startsWith('new:') ? saved[t] : oldImages.includes(t) ? t : null))
    .filter((x): x is string => !!x)
    .slice(0, MAX_PRODUCT_IMAGES);

  const slug = await uniqueSlug('products', str(fd, 'slug', 200) || name, id);
  const data = [
    categoryId, name, slug, str(fd, 'short_description', 300), str(fd, 'description', 20_000),
    JSON.stringify(specs), JSON.stringify(images),
    fd.get('is_featured') ? 1 : 0, fd.get('is_active') ? 1 : 0, int(fd, 'sort_order'),
  ];
  if (id) {
    await execute(
      'UPDATE products SET category_id=?, name=?, slug=?, short_description=?, description=?, specs=?, images=?, is_featured=?, is_active=?, sort_order=? WHERE id=?',
      [...data, id],
    );
    await Promise.all(oldImages.filter((x) => !images.includes(x)).map(deleteUpload));
  } else {
    await execute(
      'INSERT INTO products (category_id, name, slug, short_description, description, specs, images, is_featured, is_active, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
      data,
    );
  }
  redirect(withFlash('/admin/products', 'ok', id ? `“${name}” updated.` : `“${name}” added.`));
}

export async function toggleProduct(fd: FormData): Promise<void> {
  await requireAdmin();
  const field = fd.get('field') === 'is_featured' ? 'is_featured' : 'is_active';
  await execute(`UPDATE products SET ${field} = 1 - ${field} WHERE id = ?`, [int(fd, 'id')]);
  const back = String(fd.get('back') || '');
  redirect(back.startsWith('/admin/products') ? back : '/admin/products');
}

export async function deleteProduct(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = int(fd, 'id');
  const row = await queryOne<{ name: string; images: unknown }>('SELECT name, images FROM products WHERE id = ?', [id]);
  if (row) {
    await execute('DELETE FROM products WHERE id = ?', [id]);
    await Promise.all(parseJson<string[]>(row.images, []).map(deleteUpload));
  }
  redirect(withFlash('/admin/products', 'ok', row ? `“${row.name}” deleted.` : 'Product not found.'));
}
