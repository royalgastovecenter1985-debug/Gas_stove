export interface PicData {
  src: string;
  alt: string;
  w: number;
  h: number;
  lazy: boolean;
  className?: string;
  srcset?: string;
  sizes?: string;
  /** WebP source: a srcset when responsive, otherwise a single URL. */
  webp?: string;
}

/** Renders picture data computed on the server by `pictureData()`. Works in client components too. */
export function PictureView({ data }: { data: PicData }) {
  const img = (
    <img
      src={data.src}
      alt={data.alt}
      width={data.w}
      height={data.h}
      decoding="async"
      {...(data.lazy ? { loading: 'lazy' as const } : { fetchPriority: 'high' as const })}
      className={data.className}
      srcSet={data.srcset}
      sizes={data.srcset ? data.sizes : undefined}
    />
  );
  if (!data.webp) return img;
  return (
    <picture>
      <source type="image/webp" srcSet={data.webp} sizes={data.srcset ? data.sizes : undefined} />
      {img}
    </picture>
  );
}
