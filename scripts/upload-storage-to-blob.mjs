// Copies existing uploads from storage/uploads/ into Vercel Blob (one-time, safe to re-run).
//
//   node --env-file=.env.local scripts/upload-storage-to-blob.mjs
//
// Needs BLOB_READ_WRITE_TOKEN. Files keep their "assets/uploads/…" paths, so the database needs no
// change. Images also get the .webp and 500px "-sm" versions that pages expect, if missing.
import fs from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';
import sharp from 'sharp';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set (put it in .env.local).');
  process.exit(1);
}

const ROOT = process.env.UPLOAD_DIR || 'storage/uploads';
const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf' };

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (TYPES[e.name.split('.').pop().toLowerCase()]) files.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
})(ROOT);

/** path → Buffer for everything to upload (originals + generated variants). */
const out = new Map();
for (const rel of files) out.set(rel, fs.readFileSync(path.join(ROOT, rel)));

for (const rel of files) {
  const m = /^(.*?)(-sm)?\.(jpe?g|png|webp)$/i.exec(rel);
  if (!m || m[2]) continue; // not an image, or already a -sm version
  const [, stem, , ext] = m;
  const src = out.get(rel);
  const enc = (img) => (ext === 'png' ? img.png({ compressionLevel: 9 }) : ext === 'webp' ? img.webp({ quality: 78 }) : img.jpeg({ quality: 82, mozjpeg: true }));
  const sm = () => sharp(src).rotate().resize({ width: 500, withoutEnlargement: true });
  if (!out.has(`${stem}-sm.${ext}`)) out.set(`${stem}-sm.${ext}`, await enc(sm()).toBuffer());
  if (ext !== 'webp') {
    if (!out.has(`${stem}.webp`)) out.set(`${stem}.webp`, await sharp(src).rotate().webp({ quality: 80 }).toBuffer());
    if (!out.has(`${stem}-sm.webp`)) out.set(`${stem}-sm.webp`, await sm().webp({ quality: 78 }).toBuffer());
  }
}

let n = 0;
let bytes = 0;
let firstUrl = '';
const queue = [...out.entries()];
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const [rel, data] = item;
    const res = await put(`assets/uploads/${rel}`, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: TYPES[rel.split('.').pop().toLowerCase()],
      cacheControlMaxAge: 31_536_000,
      multipart: data.length > 8 * 1024 * 1024,
    });
    firstUrl ||= res.url;
    n++;
    bytes += data.length;
    console.log(`  ✓ ${rel} (${(data.length / 1048576).toFixed(1)} MB)`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`Done: ${n} files, ${(bytes / 1048576).toFixed(1)} MB.`);
if (firstUrl) console.log(`Blob address: ${new URL(firstUrl).origin}`);
