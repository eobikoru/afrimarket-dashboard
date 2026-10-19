import type { Metadata } from 'next';
import { ReviewsView } from '@/components/reviews-view';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Hide or restore an AfriBasket product review by id.',
};

export default function ReviewsPage() {
  return <ReviewsView />;
}
