import type { Metadata } from 'next';
import { InventoryView } from '@/components/inventory-view';

export const metadata: Metadata = {
  title: 'Inventory',
  description: 'AfriBasket stock counts, low stock, lots, movements, and adjustments.',
};

export default function InventoryPage() {
  return <InventoryView />;
}
