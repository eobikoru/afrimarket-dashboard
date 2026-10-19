import type { Metadata } from 'next';
import { OrdersView } from '@/components/orders-view';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Filter and open AfriBasket orders by status, payment, provider, and date.',
};

export default function OrdersPage() {
  return <OrdersView />;
}
