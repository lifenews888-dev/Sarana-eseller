import { HERDER_CATEGORIES } from '@/lib/herder-delivery';
import { intMnt } from '@/lib/herder';

export type HerderProductFields = {
  name?: string;
  description?: string;
  price?: number;
  salePrice?: number | null;
  category?: string;
  images?: string[];
  stock?: number;
  requiresColdChain?: boolean;
};

/** Малчны бүтээгдэхүүний оролтыг шалгана. partial=true бол зөвхөн ирсэн талбаруудыг. */
export function parseHerderProductInput(
  body: Record<string, unknown>,
  partial: boolean,
): { data: HerderProductFields } | { error: string } {
  const data: HerderProductFields = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
    if (name.length < 2) return { error: 'Бүтээгдэхүүний нэрээ оруулна уу' };
    data.name = name;
  }
  if (body.description !== undefined) {
    data.description = typeof body.description === 'string' ? body.description.trim().slice(0, 4000) : '';
  }
  if (!partial || body.price !== undefined) {
    const price = intMnt(body.price);
    if (!price || price < 100) return { error: 'Үнээ зөв оруулна уу (₮)' };
    data.price = price;
  }
  if (body.salePrice !== undefined) {
    if (body.salePrice === null || body.salePrice === '' || body.salePrice === 0) data.salePrice = null;
    else {
      const sale = intMnt(body.salePrice);
      if (!sale) return { error: 'Хямдралтай үнэ буруу байна' };
      data.salePrice = sale;
    }
  }
  if (data.salePrice && data.price && data.salePrice >= data.price) {
    return { error: 'Хямдралтай үнэ үндсэн үнээс бага байх ёстой' };
  }
  if (!partial || body.category !== undefined) {
    const category = typeof body.category === 'string' ? body.category : '';
    if (!(HERDER_CATEGORIES as readonly string[]).includes(category)) return { error: 'Ангиллаа сонгоно уу' };
    data.category = category;
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) return { error: 'Зураг буруу байна' };
    data.images = body.images
      .filter((u): u is string => typeof u === 'string' && /^https:\/\//i.test(u))
      .slice(0, 10);
  }
  if (body.stock !== undefined) {
    const stock = Math.floor(Number(body.stock));
    if (!Number.isFinite(stock) || stock < 0) return { error: 'Нөөцийн тоо буруу байна' };
    data.stock = Math.min(stock, 1_000_000);
  }
  if (typeof body.requiresColdChain === 'boolean') data.requiresColdChain = body.requiresColdChain;

  return { data };
}
