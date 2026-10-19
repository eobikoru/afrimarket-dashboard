import type { Metadata } from 'next';
import { ProductEditor } from '@/components/products-view';

export const metadata: Metadata = {
  title: 'Edit product',
  description: 'Edit an AfriBasket product, its pack sizes, and images.',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}
