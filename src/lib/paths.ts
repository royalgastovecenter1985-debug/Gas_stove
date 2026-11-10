import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export const PUBLIC_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), 'public');
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'storage', 'uploads'));
export const UPLOAD_PREFIX = 'assets/uploads/';

/** Map a stored path ("assets/img/…" or "assets/uploads/…") to a file on disk, or null if it escapes its root. */
export function diskPath(stored: string): string | null {
  const clean = stored.replace(/\\/g, '/').replace(/^\/+/, '');
  const [root, rel] = clean.startsWith(UPLOAD_PREFIX) ? [UPLOAD_DIR, clean.slice(UPLOAD_PREFIX.length)] : [PUBLIC_DIR, clean];
  const full = path.resolve(root, rel);
  return full.startsWith(root + path.sep) ? full : null;
}

const known = new Set<string>();

/** Does the stored path exist? Positive results for bundled /public files are cached. */
export function fileExists(stored: string): boolean {
  if (known.has(stored)) return true;
  const full = diskPath(stored);
  if (!full) return false;
  const ok = fs.existsSync(full);
  if (ok && !stored.startsWith(UPLOAD_PREFIX)) known.add(stored);
  return ok;
}
