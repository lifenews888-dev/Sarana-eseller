import type { Product } from './api';
import type { SelectedModifier } from './cart';
import type { ShowroomProduct } from './tryon';

/** Shape a showroom product for the shared cart store. */
export function toCartProduct(p: ShowroomProduct): Product {
  return {
    _id: p.id,
    id: p.id,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    images: p.images.length ? p.images : [p.tryon.img],
    description: p.description ?? undefined,
    stock: p.stock ?? undefined,
  };
}

/** The chosen size travels with the cart line as a zero-price modifier. */
export function sizeModifier(size: string | null): SelectedModifier[] {
  return size ? [{ groupId: 'tryon-size', groupName: 'Хэмжээ', optionId: size, optionName: size, price: 0 }] : [];
}

export function firstSize(p: ShowroomProduct): string | null {
  return p.tryon.sizes.find((z) => !p.tryon.out.includes(z)) ?? null;
}
