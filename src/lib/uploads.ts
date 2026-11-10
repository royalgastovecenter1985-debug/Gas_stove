import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type Sharp from 'sharp';
import { diskPath, UPLOAD_DIR, UPLOAD_PREFIX } from './paths';

export const IMAGE_MAX_MB = 10;
export const VIDEO_MAX_MB = 40;
export const PDF_MAX_MB = 25;

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

function randomName(ext: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${ymd}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
}

async function ensureDir(folder: string): Promise<string> {
  const safe = folder.replace(/[^a-z0-9_-]/gi, '');
  const dir = path.join(UPLOAD_DIR, safe);
  await fs.mkdir(dir, { recursive: true });
  return dir;
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

  const dir = await ensureDir(folder);
  const name = randomName(ext);
  const stem = path.join(dir, name.replace(/\.\w+$/, ''));
  const base = sharp(buf, { failOn: 'error' }).rotate().resize({ width: maxWidth, withoutEnlargement: true });
  const encode = (img: SharpImg, e: string) =>
    e === 'jpg' ? img.jpeg({ quality: 84, progressive: true, mozjpeg: true })
      : e === 'png' ? img.png({ compressionLevel: 9 })
        : img.webp({ quality: 82 });

  await encode(base.clone(), ext).toFile(`${stem}.${ext}`);
  if (ext !== 'webp') await base.clone().webp({ quality: 80 }).toFile(`${stem}.webp`);
  const rotated = (meta.orientation ?? 1) >= 5; // EXIF 5–8 = portrait photo stored sideways
  const width = Math.min((rotated ? meta.height : meta.width) ?? 0, maxWidth);
  if (width > 600) {
    const sm = sharp(buf).rotate().resize({ width: 500 });
    await encode(sm.clone(), ext).toFile(`${stem}-sm.${ext}`);
    if (ext !== 'webp') await sm.clone().webp({ quality: 78 }).toFile(`${stem}-sm.webp`);
  }
  return `${UPLOAD_PREFIX}${path.basename(dir)}/${name}`;
}

/** Store an MP4/WebM clip (reels). Checks the file signature, not the extension. */
export async function saveVideo(file: File, folder: string): Promise<string> {
  if (file.size > VIDEO_MAX_MB * 1024 * 1024) throw new UploadError(`${file.name}: larger than ${VIDEO_MAX_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const isMp4 = buf.subarray(4, 8).toString('latin1') === 'ftyp';
  const isWebm = buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!isMp4 && !isWebm) throw new UploadError(`${file.name}: only MP4 or WebM videos are allowed.`);
  const dir = await ensureDir(folder);
  const name = randomName(isMp4 ? 'mp4' : 'webm');
  await fs.writeFile(path.join(dir, name), buf);
  return `${UPLOAD_PREFIX}${path.basename(dir)}/${name}`;
}

export async function savePdf(file: File, folder: string): Promise<string> {
  if (file.size > PDF_MAX_MB * 1024 * 1024) throw new UploadError(`${file.name}: larger than ${PDF_MAX_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw new UploadError(`${file.name}: not a PDF file.`);
  const dir = await ensureDir(folder);
  const name = randomName('pdf');
  await fs.writeFile(path.join(dir, name), buf);
  return `${UPLOAD_PREFIX}${path.basename(dir)}/${name}`;
}

/** Delete an uploaded file and its generated variants. Never touches files outside UPLOAD_DIR. */
export async function deleteUpload(stored: string | null | undefined): Promise<void> {
  if (!stored || !stored.startsWith(UPLOAD_PREFIX)) return;
  const m = /^(.*)\.([a-z0-9]+)$/i.exec(stored);
  const variants = m ? [stored, `${m[1]}.webp`, `${m[1]}-sm.${m[2]}`, `${m[1]}-sm.webp`] : [stored];
  await Promise.all(
    [...new Set(variants)].map(async (v) => {
      const full = diskPath(v);
      if (full) await fs.unlink(full).catch(() => undefined);
    }),
  );
}
