import { redirect } from 'next/navigation';

export default function StoreProductNewRedirectPage() {
  redirect('/dashboard/store/products');
}
