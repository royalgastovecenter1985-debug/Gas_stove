import Link from 'next/link';
import { Icon } from '@/components/Icon';

export const metadata = { title: 'Page Not Found', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="container">
        <div className="notfound__code">4<span>0</span>4</div>
        <h1>This burner’s gone cold</h1>
        <p className="muted">The page you’re looking for has moved or no longer exists.</p>
        <div className="notfound__actions">
          <Link href="/" className="btn btn--dark">Back to home</Link>
          <Link href="/products" className="btn btn--outline">Browse products</Link>
          <button type="button" className="btn btn--outline" data-search-open><Icon name="search" size={18} /> Search</button>
        </div>
      </div>
    </section>
  );
}
