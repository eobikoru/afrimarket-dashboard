import type { Metadata } from 'next';
import { CustomersView } from '@/components/customers-view';

export const metadata: Metadata = {
  title: 'Customers',
  description: 'Search AfriBasket customer accounts.',
};

export default function CustomersPage() {
  return <CustomersView />;
}
