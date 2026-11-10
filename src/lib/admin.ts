import 'server-only';
import { queryOne } from './db';
import { slugify } from './format';

/** Result returned by admin form actions (shown by <ActionForm>). */
export type FormState = { error?: string; errors?: string[]; ok?: string } | null;

export const str = (fd: FormData, k: string, max = 10_000) => String(fd.get(k) ?? '').trim().slice(0, max);
export const int = (fd: FormData, k: string, def = 0) => {
  const n = parseInt(String(fd.get(k) ?? ''), 10);
  return Number.isFinite(n) ? n : def;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === '1' || fd.get(k) === 'true';

export async function uniqueSlug(table: 'products' | 'categories', base: string, ignoreId = 0): Promise<string> {
  const slug = slugify(base);
  for (let n = 1; ; n++) {
    const tryS = n === 1 ? slug : `${slug}-${n}`;
    const row = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table} WHERE slug = ? AND id <> ?`, [tryS, ignoreId]);
    if (Number(row?.n) === 0) return tryS;
  }
}

/** Build an admin URL with a one-time flash message (?ok=… or ?err=…). */
export function withFlash(path: string, kind: 'ok' | 'err', msg: string): string {
  const u = new URL(path, 'http://x');
  u.searchParams.set(kind, msg);
  return u.pathname + u.search;
}
