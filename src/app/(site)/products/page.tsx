import type { Metadata } from 'next';
import { cleanQuery, ProductsPage, productsMetadata } from '@/components/site/ProductsPage';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return productsMetadata(null, cleanQuery((await searchParams).q));
}

export default async function Page({ searchParams }: Props) {
  return <ProductsPage slug={null} q={cleanQuery((await searchParams).q)} />;
}
