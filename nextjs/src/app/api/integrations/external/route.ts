import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sanitizeImageUrls } from '@/lib/image-url';

type ExternalProductInput = {
  name?: string;
  description?: string;
  price?: string | number;
  salePrice?: string | number;
  image?: string;
  images?: unknown;
  stock?: string | number;
  url?: string;
  externalId?: string;
  source?: string;
};

type ImportResult =
  | { id: string; name: string; status: 'success' }
  | { name?: string; error: string };

function toJsonValue(input: ExternalProductInput): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue;
}

// External store API: import products with an integration API key.
export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const integration = await prisma.storeIntegration.findUnique({
    where: { apiKey },
    include: { shop: true },
  });

  if (!integration || !integration.isActive) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const body = await req.json();
  const products = (Array.isArray(body) ? body : [body]) as ExternalProductInput[];

  const results: ImportResult[] = [];
  for (const productInput of products.slice(0, 100)) {
    if (!productInput.name) {
      results.push({ error: 'name required' });
      continue;
    }

    try {
      const product = await prisma.product.create({
        data: {
          name: productInput.name,
          description: productInput.description || '',
          price: Math.round(parseFloat(String(productInput.price ?? 0)) || 0),
          salePrice: productInput.salePrice ? Math.round(parseFloat(String(productInput.salePrice))) : null,
          images: sanitizeImageUrls(
            productInput.image
              ? [productInput.image, ...(Array.isArray(productInput.images) ? productInput.images : [])]
              : productInput.images,
          ),
          stock: parseInt(String(productInput.stock ?? 0), 10) || 0,
          userId: integration.shop.userId,
          isActive: true,
        },
      });

      await prisma.importedUrl.create({
        data: {
          integrationId: integration.id,
          url: productInput.url || productInput.externalId || productInput.name,
          sourceType: productInput.source || 'api',
          productId: product.id,
          status: 'success',
          rawData: toJsonValue(productInput),
        },
      });

      results.push({ id: product.id, name: product.name, status: 'success' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'import failed';
      results.push({ name: productInput.name, error: message });
    }
  }

  await prisma.storeIntegration.update({
    where: { id: integration.id },
    data: { totalImported: { increment: results.filter((result) => !('error' in result)).length } },
  });

  return NextResponse.json({ results, total: results.length });
}
