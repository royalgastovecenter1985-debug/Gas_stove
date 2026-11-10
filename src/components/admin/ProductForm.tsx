'use client';

import Link from 'next/link';
import { useState } from 'react';
import { saveProduct } from '@/app/admin/actions/products';
import { ImageManager, type ImageItem } from './ImageManager';
import { ActionForm } from './ui';

export interface ProductFormData {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  specs: [string, string][];
  images: { path: string; url: string }[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ProductForm({ product, categories }: { product: ProductFormData; categories: { id: number; name: string }[] }) {
  const [images, setImages] = useState<ImageItem[]>(product.images.map((i) => ({ kind: 'existing', ...i })));
  const [specs, setSpecs] = useState<[string, string][]>(product.specs.length ? product.specs : [['Size (inches)', ''], ['Material', ''], ['Fuel / power', '']]);
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [slugTouched, setSlugTouched] = useState(!!product.slug);

  // Attach the photo order and the new files (kept in state, not in a file input).
  const prepare = (fd: FormData) => {
    const order: string[] = [];
    let n = 0;
    for (const it of images) {
      if (it.kind === 'existing') order.push(it.path);
      else { order.push(`new:${n++}`); fd.append('newImages', it.file, it.file.name); }
    }
    fd.set('order', JSON.stringify(order));
  };

  return (
    <ActionForm action={saveProduct} className="form-layout" prepare={prepare}>
      <input type="hidden" name="id" value={product.id} />
      <div>
        <section className="panel">
          <h2>Details</h2>
          <label>Product name *
            <input name="name" required maxLength={180} value={name}
              onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
          </label>
          <label>URL slug <small className="muted">(the address: /product/{slug || 'your-slug'})</small>
            <input name="slug" maxLength={200} pattern="[a-z0-9\-]*" value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} />
          </label>
          <label>Category *
            <select name="category_id" required defaultValue={product.category_id || ''}>
              <option value="">— Choose —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Short description <small className="muted">(one line on product cards, max 300)</small>
            <input name="short_description" maxLength={300} defaultValue={product.short_description} />
          </label>
          <label>Full description <small className="muted">(leave a blank line to start a new paragraph)</small>
            <textarea name="description" rows={8} defaultValue={product.description} />
          </label>
        </section>

        <section className="panel">
          <h2>Photos</h2>
          <ImageManager items={images} onChange={setImages} />
        </section>

        <section className="panel">
          <h2>Specifications</h2>
          <p className="small muted">“Size (inches)” is shown on product cards, e.g. 24 × 72 × 30.</p>
          {specs.map(([k, v], i) => (
            <div className="spec-row" key={i}>
              <input name="spec_key" placeholder="Label, e.g. Material" value={k}
                onChange={(e) => setSpecs(specs.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
              <input name="spec_value" placeholder="Value, e.g. SS 304" value={v}
                onChange={(e) => setSpecs(specs.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
              <button type="button" className="btn btn--ghost btn--sm" aria-label="Remove row" onClick={() => setSpecs(specs.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setSpecs([...specs, ['', '']])}>+ Add specification</button>
        </section>
      </div>

      <aside>
        <section className="panel sticky-panel">
          <h2>Publish</h2>
          <label className="check"><input type="checkbox" name="is_active" defaultChecked={product.is_active} /> Visible on website</label>
          <label className="check"><input type="checkbox" name="is_featured" defaultChecked={product.is_featured} /> Best seller (home page)</label>
          <label>Sort order <small className="muted">(lower shows first)</small><input type="number" name="sort_order" defaultValue={product.sort_order} /></label>
          <button className="btn btn--gold btn--block">{product.id ? 'Save changes' : 'Add product'}</button>
          <Link href="/admin/products" className="btn btn--ghost btn--block">Cancel</Link>
          {product.id > 0 && <a href={`/product/${product.slug}`} target="_blank" rel="noopener" className="btn btn--ghost btn--block">View on website ↗</a>}
        </section>
      </aside>
    </ActionForm>
  );
}
