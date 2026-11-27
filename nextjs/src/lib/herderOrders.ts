import type { Order } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requiresColdChain } from '@/lib/herder';

/** Захиалгуудын худалдан авагч, бүтээгдэхүүний (хүйтэн хэлхээ) мэдээллийг нэг дор ачаална */
export async function loadOrderContext(orders: Order[]) {
  const buyerIds = Array.from(new Set(orders.map((o) => o.userId)));
  const productIds = Array.from(
    new Set(
      orders.flatMap((o) =>
        ((o.items || []) as unknown as Array<{ productId?: string }>)
          .map((it) => String(it?.productId || ''))
          .filter((pid) => /^[a-f\d]{24}$/i.test(pid)),
      ),
    ),
  );
  const [buyers, products] = await Promise.all([
    buyerIds.length ? prisma.user.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true, phone: true } }) : [],
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } } }) : [],
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));
  return {
    buyers: new Map(buyers.map((b) => [b.id, b])),
    coldChain(o: Order): boolean {
      return ((o.items || []) as unknown as Array<{ productId?: string }>).some((it) => {
        const p = productMap.get(String(it?.productId || ''));
        return p ? requiresColdChain(p) : false;
      });
    },
  };
}
