import type { Metadata } from 'next';
import { ProductEditor } from '@/components/products-view';

export const metadata: Metadata = {
  title: 'New product',
  description: 'Create an AfriBasket product with price in cents, origin, and category.',
};

export default function NewProductPage() {
  return <ProductEditor />;
}
