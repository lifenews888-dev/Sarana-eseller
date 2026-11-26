import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-envelope';
import { getSafeImageList } from '@/lib/image-url';
import { isSellableProduct, normalizePublicPricing } from '@/lib/product-visibility';

const OBJECT_ID = /^[a-f\d]{24}$/i;

// GET /api/products/prices?ids=a,b,c — сагсны үнэ/үлдэгдлийг шинэчлэхэд.
// Худалдах боломжгүй (идэвхгүй, demo, устгагдсан) бараа хариунд орохгүй.
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => OBJECT_ID.test(id))
    .slice(0, 100);
  if (ids.length === 0) return fail('ids шаардлагатай', 400);

  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, name: true, description: true, price: true, salePrice: true,
        stock: true, images: true, isActive: true, isDemo: true,
      },
    });
    const products = rows.filter(isSellableProduct).map((row) => {
      const p = normalizePublicPricing(row);
      return {
        _id: p.id,
        id: p.id,
        name: p.name,
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        images: getSafeImageList(p.images),
      };
    });
    return ok({ products });
  } catch {
    return fail('Үнэ шалгаж чадсангүй', 503);
  }
}
