import type { Metadata } from 'next';
import { cleanQuery, ProductsPage, productsMetadata } from '@/components/site/ProductsPage';

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return productsMetadata((await params).category, cleanQuery((await searchParams).q));
}

export default async function Page({ params, searchParams }: Props) {
  return <ProductsPage slug={(await params).category} q={cleanQuery((await searchParams).q)} />;
}
