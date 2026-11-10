import { Icon } from '@/components/Icon';
import { Picture } from '@/components/Picture';
import type { Category } from '@/lib/data';
import { waLink, waProductMessage } from '@/lib/format';
import { Paragraphs } from './RichText';

export function CategoryIntro({ category, wa }: { category: Category; wa: string }) {
  return (
    <div className="category-intro" id="categoryIntro">
      <div className="category-intro__media">
        <Picture path={category.image} alt={category.name} lazy={false} w={500} h={375} sizes="280px" />
      </div>
      <div>
        <h2>{category.name}</h2>
        <Paragraphs text={category.description} />
        <div className="cta-row">
          <button type="button" className="btn btn--dark btn--sm" data-quick-inquiry data-product={category.name}>Get a quote <Icon name="arrow" size={16} /></button>
          <a href={waLink(wa, waProductMessage(category.name))} className="btn btn--outline btn--sm" target="_blank" rel="noopener"><Icon name="whatsapp" size={16} /> WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
