import { redirect } from 'next/navigation';

export default function StoreProfileRedirectPage() {
  redirect('/dashboard/store/settings');
}
