'use server';

import { redirect } from 'next/navigation';
import { int, str, uniqueSlug, withFlash, type FormState } from '@/lib/admin';
import { requireAdmin } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { INQUIRY_STATUSES } from '@/lib/format';
import { deleteUpload, isFile, readUploads, saveImage, saveVideo, UploadError } from '@/lib/uploads';

const uploadError = (e: unknown): FormState => ({ error: e instanceof UploadError ? e.message : 'Could not save the file. Please try again.' });

/* ---------------- Categories ---------------- */

export async function saveCategory(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const fd = await readUploads(form);
  if (!fd) return { error: 'An uploaded file could not be read. Please choose it again and save.' };
  const id = int(fd, 'id');
  const name = str(fd, 'name', 120);
  if (!name) return { error: 'Category name is required.' };
  const old = id ? await queryOne<{ image: string | null }>('SELECT image FROM categories WHERE id = ?', [id]) : null;
  if (id && !old) return { error: 'This category no longer exists.' };

  let image = old?.image ?? null;
  const file = fd.get('image');
  if (isFile(file)) {
    try { image = await saveImage(file, 'categories'); } catch (e) { return uploadError(e); }
  }
  const slug = await uniqueSlug('categories', str(fd, 'slug', 140) || name, id);
  const data = [name, slug, str(fd, 'tagline', 255) || null, str(fd, 'description', 5000), image, int(fd, 'sort_order'), fd.get('is_active') ? 1 : 0];
  if (id) {
    await execute('UPDATE categories SET name=?, slug=?, tagline=?, description=?, image=?, sort_order=?, is_active=? WHERE id=?', [...data, id]);
    if (old?.image !== image) await deleteUpload(old?.image);
  } else {
    await execute('INSERT INTO categories (name, slug, tagline, description, image, sort_order, is_active) VALUES (?,?,?,?,?,?,?)', data);
  }
  redirect(withFlash('/admin/categories', 'ok', id ? `“${name}” updated.` : `“${name}” added.`));
}

export async function deleteCategory(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = int(fd, 'id');
  const n = await queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM products WHERE category_id = ?', [id]);
  if (Number(n?.n) > 0) {
    redirect(withFlash('/admin/categories', 'err', `This category still has ${n?.n} product(s). Move or delete them first.`));
  }
  const row = await queryOne<{ name: string; image: string | null }>('SELECT name, image FROM categories WHERE id = ?', [id]);
  if (row) {
    await execute('DELETE FROM categories WHERE id = ?', [id]);
    await deleteUpload(row.image);
  }
  redirect(withFlash('/admin/categories', 'ok', 'Category deleted.'));
}

/* ---------------- Certificates ---------------- */

export async function saveCertificate(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const fd = await readUploads(form);
  if (!fd) return { error: 'An uploaded file could not be read. Please choose it again and save.' };
  const id = int(fd, 'id');
  const title = str(fd, 'title', 160);
  if (!title) return { error: 'Certificate title is required.' };
  const old = id ? await queryOne<{ image: string }>('SELECT image FROM certificates WHERE id = ?', [id]) : null;
  if (id && !old) return { error: 'This certificate no longer exists.' };

  let image = old?.image ?? '';
  const file = fd.get('image');
  if (isFile(file)) {
    try { image = await saveImage(file, 'certificates', 2000); } catch (e) { return uploadError(e); }
  }
  if (!image) return { error: 'Please upload the certificate image (JPG, PNG or WebP).' };
  const data = [title, str(fd, 'issued_by', 160) || null, str(fd, 'year', 10) || null, image, int(fd, 'sort_order'), fd.get('is_active') ? 1 : 0];
  if (id) {
    await execute('UPDATE certificates SET title=?, issued_by=?, year=?, image=?, sort_order=?, is_active=? WHERE id=?', [...data, id]);
    if (old?.image !== image) await deleteUpload(old?.image);
  } else {
    await execute('INSERT INTO certificates (title, issued_by, year, image, sort_order, is_active) VALUES (?,?,?,?,?,?)', data);
  }
  redirect(withFlash('/admin/certificates', 'ok', id ? 'Certificate updated.' : 'Certificate added.'));
}

export async function deleteCertificate(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = int(fd, 'id');
  const row = await queryOne<{ image: string }>('SELECT image FROM certificates WHERE id = ?', [id]);
  if (row) {
    await execute('DELETE FROM certificates WHERE id = ?', [id]);
    await deleteUpload(row.image);
  }
  redirect(withFlash('/admin/certificates', 'ok', 'Certificate deleted.'));
}

/* ---------------- Testimonials ---------------- */

export async function saveTestimonial(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(fd, 'id');
  const name = str(fd, 'name', 120);
  const message = str(fd, 'message', 3000);
  if (!name || !message) return { error: 'Customer name and review text are required.' };
  const rating = Math.max(1, Math.min(5, int(fd, 'rating', 5)));
  const data = [name, str(fd, 'designation', 160) || null, message, str(fd, 'product', 180) || null, rating, int(fd, 'sort_order'), fd.get('is_active') ? 1 : 0];
  if (id) await execute('UPDATE testimonials SET name=?, designation=?, message=?, product=?, rating=?, sort_order=?, is_active=? WHERE id=?', [...data, id]);
  else await execute('INSERT INTO testimonials (name, designation, message, product, rating, sort_order, is_active) VALUES (?,?,?,?,?,?,?)', data);
  redirect(withFlash('/admin/testimonials', 'ok', id ? 'Testimonial updated.' : 'Testimonial added.'));
}

export async function deleteTestimonial(fd: FormData): Promise<void> {
  await requireAdmin();
  await execute('DELETE FROM testimonials WHERE id = ?', [int(fd, 'id')]);
  redirect(withFlash('/admin/testimonials', 'ok', 'Testimonial deleted.'));
}

/* ---------------- Reels ---------------- */

export async function saveReel(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const fd = await readUploads(form);
  if (!fd) return { error: 'An uploaded file could not be read. Please choose it again and save.' };
  const id = int(fd, 'id');
  const title = str(fd, 'title', 160);
  const link = str(fd, 'link', 255);
  if (!title) return { error: 'Please enter a caption.' };
  if (link && !/^https?:\/\//i.test(link)) return { error: 'The reel link must start with https://' };
  const old = id ? await queryOne<{ poster: string; video: string | null }>('SELECT poster, video FROM reels WHERE id = ?', [id]) : null;
  if (id && !old) return { error: 'This reel no longer exists.' };

  let poster = old?.poster ?? '';
  let video = old?.video ?? null;
  const pf = fd.get('poster');
  const vf = fd.get('video');
  const fresh: string[] = [];
  try {
    if (isFile(pf)) { poster = await saveImage(pf, 'reels', 1080); fresh.push(poster); }
    if (isFile(vf)) { video = await saveVideo(vf, 'reels'); fresh.push(video); }
  } catch (e) {
    await Promise.all(fresh.map(deleteUpload));
    return uploadError(e);
  }
  if (fd.get('remove_video') && !isFile(vf)) video = null;
  if (!poster) return { error: 'Please upload a cover image.' };

  const data = [title, link || null, poster, video, int(fd, 'sort_order'), fd.get('is_active') ? 1 : 0];
  if (id) {
    await execute('UPDATE reels SET title=?, link=?, poster=?, video=?, sort_order=?, is_active=? WHERE id=?', [...data, id]);
    if (old?.poster !== poster) await deleteUpload(old?.poster);
    if (old?.video && old.video !== video) await deleteUpload(old.video);
  } else {
    await execute('INSERT INTO reels (title, link, poster, video, sort_order, is_active) VALUES (?,?,?,?,?,?)', data);
  }
  redirect(withFlash('/admin/reels', 'ok', id ? 'Reel updated.' : 'Reel added.'));
}

export async function deleteReel(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = int(fd, 'id');
  const row = await queryOne<{ poster: string; video: string | null }>('SELECT poster, video FROM reels WHERE id = ?', [id]);
  if (row) {
    await execute('DELETE FROM reels WHERE id = ?', [id]);
    await Promise.all([deleteUpload(row.poster), deleteUpload(row.video)]);
  }
  redirect(withFlash('/admin/reels', 'ok', 'Reel deleted.'));
}

/* ---------------- Toggle "visible" on simple tables ---------------- */

const TOGGLE_TABLES: Record<string, string> = {
  categories: '/admin/categories', certificates: '/admin/certificates', testimonials: '/admin/testimonials', reels: '/admin/reels',
};

export async function toggleActive(fd: FormData): Promise<void> {
  await requireAdmin();
  const table = String(fd.get('table'));
  if (!TOGGLE_TABLES[table]) redirect('/admin');
  await execute(`UPDATE ${table} SET is_active = 1 - is_active WHERE id = ?`, [int(fd, 'id')]);
  redirect(TOGGLE_TABLES[table]);
}

/* ---------------- Inquiries ---------------- */

function inquiriesBack(fd: FormData): string {
  const back = String(fd.get('back') || '');
  return back.startsWith('/admin/inquiries') ? back : '/admin/inquiries';
}

export async function setInquiryStatus(fd: FormData): Promise<void> {
  await requireAdmin();
  const status = String(fd.get('status'));
  if ((INQUIRY_STATUSES as readonly string[]).includes(status)) {
    await execute('UPDATE inquiries SET status = ? WHERE id = ?', [status, int(fd, 'id')]);
  }
  redirect(inquiriesBack(fd));
}

export async function deleteInquiry(fd: FormData): Promise<void> {
  await requireAdmin();
  await execute('DELETE FROM inquiries WHERE id = ?', [int(fd, 'id')]);
  redirect(withFlash(inquiriesBack(fd), 'ok', 'Inquiry deleted.'));
}
