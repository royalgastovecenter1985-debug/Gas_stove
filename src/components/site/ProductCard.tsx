import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Picture } from '@/components/Picture';
import { productSize, type Product } from '@/lib/data';
import { waLink, waProductMessage } from '@/lib/format';

export function ProductCard({ product, index, wa }: { product: Product; index?: number; wa: string }) {
  const href = `/product/${product.slug}`;
  const delay = index !== undefined ? Math.min(index % 4, 3) * 70 : 0;
  const size = productSize(product);
  return (
    <article className="pcard reveal" style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <div className="pcard__media">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Picture path={product.image} alt={product.name} className="pcard__img" w={500} h={375}
            sizes="(min-width:1280px) 280px, (min-width:768px) 33vw, 50vw" />
        </Link>
        {!!product.is_featured && <span className="tag">Best seller</span>}
        <button type="button" className="pcard__quick" data-quick-inquiry data-product={product.name}><Icon name="chat" size={16} /> Quick inquiry</button>
      </div>
      <div className="pcard__body">
        <Link href={`/products/${product.category_slug}`} className="pcard__cat">{product.category_name}</Link>
        <h3 className="pcard__title"><Link href={href}>{product.name}</Link></h3>
        <p className="pcard__meta">{size ? <><Icon name="ruler" size={14} /> {size} in</> : 'Made to order'}</p>
        <div className="pcard__actions">
          <Link href={href} className="pcard__link">View details</Link>
          <a href={waLink(wa, waProductMessage(product.name))} className="pcard__wa" target="_blank" rel="noopener" aria-label={`Ask about ${product.name} on WhatsApp`}>
            <Icon name="whatsapp" size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}
