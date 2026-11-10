import 'server-only';
import { pictureData } from '@/lib/picture';
import { PictureView } from './PictureView';

/** Server-side responsive image: <Picture path="assets/img/…" alt="…" sizes="…" />. */
export function Picture(props: {
  path: string | null | undefined;
  alt?: string;
  className?: string;
  lazy?: boolean;
  w?: number;
  h?: number;
  sizes?: string;
}) {
  const { path, ...opts } = props;
  return <PictureView data={pictureData(path, opts)} />;
}
