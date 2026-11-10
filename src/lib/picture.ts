import 'server-only';
import { imgSrc } from './format';
import { fileExists } from './paths';
import type { PicData } from '@/components/PictureView';

/**
 * Responsive <picture> data for a stored image path. Uses sibling files when present:
 *   foo.jpg (1000w) · foo-sm.jpg (500w) · foo.webp · foo-sm.webp
 * `sizes` is the CSS sizes hint; without it a single image is served.
 */
export function pictureData(
  stored: string | null | undefined,
  opts: { alt?: string; className?: string; lazy?: boolean; w?: number; h?: number; sizes?: string } = {},
): PicData {
  const p = stored || 'assets/img/placeholder.svg';
  const { alt = '', className, lazy = true, w = 600, h = 450, sizes = '' } = opts;
  const dot = p.lastIndexOf('.');
  const ext = dot > 0 ? p.slice(dot + 1) : '';
  const stem = dot > 0 ? p.slice(0, dot) : p;
  const local = !/^https?:\/\//i.test(p);
  const has = (x: string) => local && fileExists(x);

  const srcset = (e: string) =>
    [has(`${stem}-sm.${e}`) ? `${imgSrc(`${stem}-sm.${e}`)} 500w` : '', has(`${stem}.${e}`) ? `${imgSrc(`${stem}.${e}`)} 1000w` : '']
      .filter(Boolean)
      .join(', ');

  const responsive = sizes !== '' && has(`${stem}-sm.${ext}`);
  const src = responsive && w <= 520 ? `${stem}-sm.${ext}` : p;
  const data: PicData = { src: imgSrc(src), alt, w, h, lazy, className };
  if (responsive) {
    data.srcset = srcset(ext);
    data.sizes = sizes;
  }
  if (['jpg', 'jpeg', 'png'].includes(ext.toLowerCase()) && has(`${stem}.webp`)) {
    data.webp = responsive ? srcset('webp') : imgSrc(`${stem}.webp`);
  }
  return data;
}

/** URL of the .webp sibling when it exists (used by the product gallery thumbnails). */
export function webpOf(stored: string): string {
  const w = stored.replace(/\.(jpe?g|png)$/i, '.webp');
  return w !== stored && fileExists(w) ? imgSrc(w) : imgSrc(stored);
}

/** URL of the 500px sibling when it exists (search suggestions, admin thumbnails). */
export function smallOf(stored: string | null | undefined): string {
  if (!stored) return imgSrc(null);
  const sm = stored.replace(/\.(jpe?g|png|webp)$/i, '-sm.$1');
  return sm !== stored && fileExists(sm) ? imgSrc(sm) : imgSrc(stored);
}
