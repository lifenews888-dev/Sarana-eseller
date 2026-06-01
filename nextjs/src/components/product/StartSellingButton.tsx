'use client';

import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

interface StartSellingButtonProps {
  productId: string;
  productName: string;
  commission?: number;
  className?: string;
}

export default function StartSellingButton({ productId, productName, commission, className }: StartSellingButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleClick = async () => {
    if (!isLoggedIn) {
      const returnTo = `/product/${productId}`;
      sessionStorage.setItem('sarana_redirect', returnTo);
      toast.show('Борлуулагч болохын тулд нэвтэрнэ үү', 'warn');
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/affiliate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        toast.show(`"${productName}" борлуулж эхэллээ!`, 'ok');
      } else {
        const data = await res.json();
        toast.show(data.error || 'Алдаа гарлаа', 'error');
      }
    } catch {
      toast.show('Сервертэй холбогдож чадсангүй', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
        'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 disabled:opacity-50',
        className
      )}
    >
      <Megaphone size={18} />
      {loading ? 'Уншиж байна...' : `Борлуулж эхлэх${commission ? ` (${commission}%)` : ''}`}
    </button>
  );
}
