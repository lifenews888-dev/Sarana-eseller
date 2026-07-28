import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-envelope';
import { DEMO_PRODUCTS } from '@/lib/utils';
import { getSafeImageList } from '@/lib/image-url';
import { isPublicLaunchProduct, normalizePublicPricing } from '@/lib/product-visibility';

type DemoProduct = (typeof DEMO_PRODUCTS)[number] & { images?: string[]; stock?: number };

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

function demoProduct(id: string) {
  const product = (DEMO_PRODUCTS as DemoProduct[]).find((item) => item._id === id);
  if (!product) return null;

  const images = getSafeImageList(product.images || []);

  return {
    id: product._id,
    _id: product._id,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    description: product.description,
    images,
    stock: product.stock,
    category: product.category,
    emoji: product.emoji,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isActive: true,
    deliveryFee: null,
    deliveryType: null,
    estimatedMins: null,
    entityType: 'STORE',
    area: null,
    rooms: null,
    floor: null,
    totalFloors: null,
    district: null,
    year: null,
    mileage: null,
    fuelType: null,
    transmission: null,
    brand: null,
    duration: null,
    availableSlots: null,
    totalUnits: null,
    soldUnits: null,
    completionDate: null,
    pricePerSqm: null,
    minBatch: null,
    currentBatch: null,
    advancePercent: null,
    deliveryEstimate: null,
    fileType: null,
    fileSize: null,
    downloadCount: null,
    shop: product.store || null,
    seller: product.store ? { id: 'demo-seller', name: product.store.name, avatar: null } : null,
    dropship: null,
  };
}

// GET /api/products/[id] — product detail for mobile/web
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    const product = demoProduct(id);
    return product ? ok(product) : fail('Бараа олдсонгүй', 404);
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            shops: {
              select: { id: true, name: true, slug: true, logo: true },
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        },
        shop: { select: { id: true, name: true, slug: true, logo: true } },
        // DropshipProduct is 1:1 via productId. When present the mobile +
        // web UIs render "imported from abroad" badges and longer ETAs.
        dropship: {
          select: {
            supplierName: true,
            supplierCurrency: true,
            supplierStock: true,
            supplierShipping: true,
          },
        },
      },
    });

    if (!product || !isPublicLaunchProduct(product)) {
      return fail('Бараа олдсонгүй', 404);
    }

    const priced = normalizePublicPricing(product);
    const shopSummary =
      product.shop ||
      product.user?.shops?.[0] ||
      null;

    return ok({
      id: product.id,
      _id: product.id,
      name: product.name,
      price: priced.price,
      salePrice: priced.salePrice,
      description: product.description,
      images: getSafeImageList(product.images),
      stock: product.stock,
      category: product.category,
      emoji: product.emoji,
      rating: product.rating,
      reviewCount: product.reviewCount,
      isActive: product.isActive,
      // Delivery metadata — web product detail and storefront modal render
      // these directly. Mobile gained parity with AUDIT M1.
      deliveryFee: product.deliveryFee,
      deliveryType: product.deliveryType,
      estimatedMins: product.estimatedMins,
      entityType: product.entityType,
      // Entity-specific fields — mobile renders distinct layouts per
      // entityType (REAL_ESTATE / SERVICE / PRE_ORDER / AUTO / CONSTRUCTION
      // / DIGITAL) mirroring web ProductDetailClient. Fields are nullable on
      // the Product model so STORE listings return `null` for all of them.
      // Real estate
      area: product.area,
      rooms: product.rooms,
      floor: product.floor,
      totalFloors: product.totalFloors,
      district: product.district,
      // Auto
      year: product.year,
      mileage: product.mileage,
      fuelType: product.fuelType,
      transmission: product.transmission,
      brand: product.brand,
      // Service
      duration: product.duration,
      availableSlots: product.availableSlots,
      // Construction
      totalUnits: product.totalUnits,
      soldUnits: product.soldUnits,
      completionDate: product.completionDate,
      pricePerSqm: product.pricePerSqm,
      // Pre-order
      minBatch: product.minBatch,
      currentBatch: product.currentBatch,
      advancePercent: product.advancePercent,
      deliveryEstimate: product.deliveryEstimate,
      // Digital
      fileType: product.fileType,
      fileSize: product.fileSize,
      downloadCount: product.downloadCount,
      shopId: shopSummary?.id || product.shopId || null,
      shop: shopSummary,
      seller: product.user ? { id: product.user.id, name: product.user.name, avatar: product.user.avatar } : null,
      user: product.user
        ? {
            id: product.user.id,
            _id: product.user.id,
            name: product.user.name,
            avatar: product.user.avatar,
            shops: product.user.shops || [],
          }
        : null,
      // Null for non-dropship products; populated flat object otherwise so
      // clients can `if (product.dropship) {...}` without a null check on
      // each field.
      dropship: product.dropship
        ? {
            supplierName: product.dropship.supplierName,
            supplierCurrency: product.dropship.supplierCurrency,
            supplierStock: product.dropship.supplierStock,
            supplierShipping: product.dropship.supplierShipping,
            // Standard AliExpress/CJ international air-freight window.
            // Stored per-product in `supplierData` for now; hardcoding here
            // until the import pipeline captures per-supplier estimates.
            estimatedShippingDaysMin: 15,
            estimatedShippingDaysMax: 30,
          }
        : null,
    });
  } catch (err) {
    console.error('Product detail error:', err);
    return fail('Бараа ачаалахад алдаа', 500);
  }
}
