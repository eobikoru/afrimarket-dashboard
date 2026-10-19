import type { Metadata } from 'next';
import { CustomerDetailView } from '@/components/customers-view';

export const metadata: Metadata = {
  title: 'Customer',
  description: 'AfriBasket customer profile, addresses, and recent orders.',
};

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailView id={id} />;
}
