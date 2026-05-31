import { redirect } from 'next/navigation';

export default function StoreTrackingRedirectPage() {
  redirect('/dashboard/store/orders');
}
