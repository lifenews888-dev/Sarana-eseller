import { Suspense } from 'react';
import ShopsPageClient from './ShopsPageClient';

export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsLoading />}>
      <ShopsPageClient />
    </Suspense>
  );
}

function ShopsLoading() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1320px] items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#E8242C]" />
      </div>
    </div>
  );
}
