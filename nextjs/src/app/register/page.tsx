import { redirect } from 'next/navigation';
import { safeRelativeRedirect } from '@/lib/safe-redirect';

type RegisterSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function RegisterPage({ searchParams }: { searchParams: RegisterSearchParams }) {
  const params = await searchParams;
  const target = safeRelativeRedirect(readParam(params.redirect) || readParam(params.next));
  const query = target ? `?redirect=${encodeURIComponent(target)}` : '';

  redirect(`/login${query}#register`);
}
