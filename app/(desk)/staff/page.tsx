import type { Metadata } from 'next';
import { StaffView } from '@/components/staff-view';

export const metadata: Metadata = {
  title: 'Staff',
  description: 'Super admin tools for AfriBasket staff accounts and the audit log.',
};

export default function StaffPage() {
  return <StaffView />;
}
