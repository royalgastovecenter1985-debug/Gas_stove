import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type Sharp from 'sharp';
import { del, put } from '@vercel/blob';
import { UPLOADS_URL } from './format';
import { diskPath, UPLOAD_PREFIX } from './paths';

export const IMAGE_MAX_MB = 10;
export const VIDEO_MAX_MB = 40;
export const PDF_MAX_MB = 25;

/**
 * Where uploads are kept:
 *  - Vercel Blob when BLOB_READ_WRITE_TOKEN is set (Vercel has no permanent disk), at the same
 *    "assets/uploads/…" path that is stored in the database;
 *  - otherwise the UPLOAD_DIR folder on this server's disk.
 */
export const BLOB_UPLOADS = !!(process.env.BLOB_READ_WRITE_TOKEN && UPLOADS_URL);

type SharpImg = ReturnType<typeof Sharp>;

/** sharp is loaded only when an image is uploaded, so a missing native library can't break other admin pages. */
async function loadSharp(): Promise<typeof Sharp> {
  try {
    return (await import('sharp')).default;
  } catch (e) {
    console.error('sharp failed to load:', e);
    throw new UploadError('Image processing is not available on this server (the "sharp" package failed to load). See README → Troubleshooting.');
  }
}

export class UploadError extends Error {}

const CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
};

function randomName(ext: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${ymd}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
}

/** Write one file to Blob or disk. `stored` is the "assets/uploads/folder/name.ext" path kept in the database. */
async function writeUpload(stored: string, data: Buffer): Promise<void> {
  const ext = stored.split('.').pop() ?? '';
  if (BLOB_UPLOADS) {
    await put(stored, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: CONTENT_TYPE[ext],
      cacheControlMaxAge: 31_536_000, // names are random and never reused
    });
    return;
  }
  const full = diskPath(stored);
  if (!full) throw new UploadError('Invalid upload path.');
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
}

function newPath(folder: string, ext: string): string {
  return `${UPLOAD_PREFIX}${folder.replace(/[^a-z0-9_-]/gi, '')}/${randomName(ext)}`;
}

/** True for a real, non-empty file from a multipart form. */
export function isFile(v: FormDataEntryValue | null | undefined): v is File {
  return typeof v === 'object' && v !== null && 'arrayBuffer' in v && (v as File).size > 0;
}

/**
 * Validate and store an uploaded image. The file's real format is read by sharp (the browser's
 * claimed type is ignored). Saves the image (EXIF-rotated, max `maxWidth` px) plus a .webp copy and
 * 500px "-sm" versions used by responsive <picture> tags. Returns the stored path.
 */
export async function saveImage(file: File, folder: string, maxWidth = 1600): Promise<string> {
  if (file.size > IMAGE_MAX_MB * 1024 * 1024) throw new UploadError(`${file.name}: larger than ${IMAGE_MAX_MB} MB.`);
  const sharp = await loadSharp();
  const buf = Buffer.from(await file.arrayBuffer());
  let meta: Awaited<ReturnType<SharpImg['metadata']>>;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new UploadError(`${file.name}: not a valid image.`);
  }
  const ext = ({ jpeg: 'jpg', png: 'png', webp: 'webp' } as Record<string, string>)[meta.format ?? ''];
  if (!ext) throw new UploadError(`${file.name}: only JPG, PNG or WebP images are allowed.`);

  const stored = newPath(folder, ext);
  const stem = stored.replace(/\.\w+$/, '');
  const encode = (img: SharpImg, e: string) =>
    e === 'jpg' ? img.jpeg({ quality: 84, progressive: true, mozjpeg: true })
      : e === 'png' ? img.png({ compressionLevel: 9 })
        : img.webp({ quality: 82 });

  const base = sharp(buf, { failOn: 'error' }).rotate().resize({ width: maxWidth, withoutEnlargement: true });
  // The 500px "-sm" versions are always made, so pages can rely on them without checking.
  const sm = sharp(buf).rotate().resize({ width: 500, withoutEnlargement: true });
  const files: [string, Promise<Buffer>][] = [
    [stored, encode(base.clone(), ext).toBuffer()],
    [`${stem}-sm.${ext}`, encode(sm.clone(), ext).toBuffer()],
  ];
  if (ext !== 'webp') {
    files.push([`${stem}.webp`, base.clone().webp({ quality: 80 }).toBuffer()]);
    files.push([`${stem}-sm.webp`, sm.clone().webp({ quality: 78 }).toBuffer()]);
  }
  await Promise.all(files.map(async ([p, data]) => writeUpload(p, await data)));
  return stored;
}

/** Store an MP4/WebM clip (reels). Checks the file signature, not the extension. */
export async function saveVideo(file: File, folder: string): Promise<string> {
  if (file.size > VIDEO_MAX_MB * 1024 * 1024) throw new UploadError(`${file.name}: larger than ${VIDEO_MAX_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const isMp4 = buf.subarray(4, 8).toString('latin1') === 'ftyp';
  const isWebm = buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!isMp4 && !isWebm) throw new UploadError(`${file.name}: only MP4 or WebM videos are allowed.`);
  const stored = newPath(folder, isMp4 ? 'mp4' : 'webm');
  await writeUpload(stored, buf);
  return stored;
}

export async function savePdf(file: File, folder: string): Promise<string> {
  if (file.size > PDF_MAX_MB * 1024 * 1024) throw new UploadError(`${file.name}: larger than ${PDF_MAX_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw new UploadError(`${file.name}: not a PDF file.`);
  const stored = newPath(folder, 'pdf');
  await writeUpload(stored, buf);
  return stored;
}

/** Delete an uploaded file and its generated variants. Never touches files outside the uploads folder. */
export async function deleteUpload(stored: string | null | undefined): Promise<void> {
  if (!stored || !stored.startsWith(UPLOAD_PREFIX)) return;
  const m = /^(.*)\.([a-z0-9]+)$/i.exec(stored);
  const variants = [...new Set(m ? [stored, `${m[1]}.webp`, `${m[1]}-sm.${m[2]}`, `${m[1]}-sm.webp`] : [stored])];
  if (BLOB_UPLOADS) {
    await del(variants).catch((e) => console.error('blob delete:', e));
    return;
  }
  await Promise.all(
    variants.map(async (v) => {
      const full = diskPath(v);
      if (full) await fs.unlink(full).catch(() => undefined);
    }),
  );
}

/* ---------------- Direct-to-Blob uploads from the admin forms ---------------- */

/** Temporary uploads land here; they are deleted once the form is saved (or after 1 day). */
export const TMP_PREFIX = 'tmp/';

/**
 * Vercel only accepts ~4.5 MB per request, so on Vercel the admin's browser uploads each chosen
 * file straight to Blob (under tmp/) and the form sends "blob:<url>" instead of the file.
 * This swaps those references back into real File objects, so form actions work unchanged.
 */
export async function resolveUploads(fd: FormData): Promise<FormData> {
  if (!BLOB_UPLOADS) return fd;
  const out = new FormData();
  const tmp: string[] = [];
  for (const [key, value] of fd.entries()) {
    if (typeof value !== 'string' || !value.startsWith('blob:')) {
      out.append(key, value);
      continue;
    }
    const url = new URL(value.slice(5));
    // Only our own store's tmp/ folder: never fetch an arbitrary URL from a form.
    if (url.origin !== new URL(UPLOADS_URL).origin || !url.pathname.startsWith('/' + TMP_PREFIX)) {
      throw new UploadError('Invalid upload reference.');
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new UploadError('An uploaded file could not be read back. Please try again.');
    const name = decodeURIComponent(url.pathname.split('/').pop() || 'upload');
    out.append(key, new File([await res.arrayBuffer()], name, { type: res.headers.get('content-type') || '' }));
    tmp.push(url.toString());
  }
  if (tmp.length) await del(tmp).catch((e) => console.error('blob tmp delete:', e));
  return out;
}

/** resolveUploads for form actions: null when an uploaded file could not be read back. */
export async function readUploads(fd: FormData): Promise<FormData | null> {
  try {
    return await resolveUploads(fd);
  } catch (e) {
    console.error('readUploads:', e);
    return null;
  }
}
