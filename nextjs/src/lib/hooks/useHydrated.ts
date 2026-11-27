import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Hydration дуусах хүртэл false, дараа нь true.
 * localStorage-оос уншдаг (нэвтэрсэн хэрэглэгч гэх мэт) бичвэрийг серверийн HTML-тэй
 * зөрүүлэхгүйн тулд ашиглана — эс бөгөөс React #418 (hydration mismatch) алдаа гарна.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
