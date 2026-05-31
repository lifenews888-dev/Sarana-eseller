import { redirect } from 'next/navigation';

export default function StoreFilesRedirectPage() {
  redirect('/dashboard/store/downloads');
}
