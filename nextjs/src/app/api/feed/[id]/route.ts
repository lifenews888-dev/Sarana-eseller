import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { buildOwnedFeedWhere } from '@/lib/feedOwnership';
import { sanitizeImageUrls } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string }> };
type MetadataValue = string | number | boolean | string[];
type MetadataRecord = Record<string, MetadataValue>;

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

const SPECIAL_ENTITY_TYPES = new Set(['agent', 'company', 'auto_dealer']);
const VALID_TIERS = new Set(['normal', 'featured', 'vip', 'discounted']);
const REQUIRED_SPECIAL_METADATA_KEYS: Record<string, string[]> = {
  agent: ['propertyType', 'sqm', 'rooms'],
  company: ['projectStatus', 'totalUnits', 'pricePerSqm', 'completionDate'],
  auto_dealer: ['brand', 'model', 'year', 'mileage'],
};
const NUMBER_METADATA_KEYS = new Set([
  'sqm', 'area', 'rooms', 'bedrooms', 'bathrooms', 'floor', 'totalFloors',
  'builtYear', 'windowCount', 'maintenanceFeeMnt', 'pricePerSqm',
  'totalUnits', 'soldUnits', 'availableUnits', 'floors', 'year', 'mileage',
  'ownersCount', 'minBatch', 'currentBatch', 'advancePercent', 'availableSlots',
]);
const BOOLEAN_METADATA_KEYS = new Set(['certificateReady', 'mortgageAvailable']);
const LIST_METADATA_KEYS = new Set([
  'highlights', 'nearby', 'documents', 'roomChoices', 'amenities',
  'paymentTerms', 'features',
]);

function hasField(source: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeStringList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\n,]/) : [];
  return values
    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
    .filter(Boolean);
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[,\s₮]/g, '');
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'тийм'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'үгүй'].includes(normalized)) return false;
  return null;
}

function normalizeMediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function defaultCategory(entityType: string, metadata: MetadataRecord): string {
  if (entityType === 'company') return 'new_building';
  if (entityType === 'auto_dealer') return 'vehicle';
  if (entityType === 'service') return 'service';
  if (entityType !== 'agent') return '';

  const propertyType = String(metadata.propertyType || '').toLowerCase();
  if (propertyType.includes('газар') || propertyType.includes('land')) return 'land';
  if (propertyType.includes('оффис') || propertyType.includes('office')) return 'office';
  if (propertyType.includes('хаус') || propertyType.includes('house')) return 'house';
  return 'apartment';
}

function normalizeMetadata(
  value: unknown,
  entityType: string,
  district: string,
  price: number | null
): MetadataRecord {
  const clean: MetadataRecord = {};

  for (const [key, raw] of Object.entries(objectRecord(value))) {
    if (NUMBER_METADATA_KEYS.has(key)) {
      const n = toOptionalNumber(raw);
      if (n !== null) clean[key] = n;
      continue;
    }

    if (BOOLEAN_METADATA_KEYS.has(key)) {
      const b = toOptionalBoolean(raw);
      if (b !== null) clean[key] = b;
      continue;
    }

    if (LIST_METADATA_KEYS.has(key)) {
      const list = normalizeStringList(raw);
      if (list.length > 0) clean[key] = list;
      continue;
    }

    if (typeof raw === 'string') {
      const str = raw.trim();
      if (str) clean[key] = str;
    } else if (typeof raw === 'number' && Number.isFinite(raw)) {
      clean[key] = raw;
    } else if (typeof raw === 'boolean') {
      clean[key] = raw;
    } else if (Array.isArray(raw)) {
      const list = normalizeStringList(raw);
      if (list.length > 0) clean[key] = list;
    }
  }

  if (district && !clean.district) clean.district = district;
  if (typeof clean.sqm === 'number' && !clean.area) clean.area = clean.sqm;

  const sqm = typeof clean.sqm === 'number' ? clean.sqm : null;
  if (entityType === 'agent' && price && sqm && !clean.pricePerSqm) {
    clean.pricePerSqm = Math.round(price / sqm);
  }

  const totalUnits = typeof clean.totalUnits === 'number' ? clean.totalUnits : null;
  const soldUnits = typeof clean.soldUnits === 'number' ? clean.soldUnits : null;
  if (entityType === 'company' && totalUnits !== null && soldUnits !== null && !clean.availableUnits) {
    clean.availableUnits = Math.max(0, totalUnits - soldUnits);
  }

  return clean;
}

function hasMetadataValue(metadata: MetadataRecord, key: string): boolean {
  const value = metadata[key];
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== '';
}

function validateSpecialListing(
  entityType: string,
  description: string,
  imageUrls: string[],
  metadata: MetadataRecord
): string | null {
  if (!SPECIAL_ENTITY_TYPES.has(entityType)) return null;
  if (description.length < 30) return 'Онцгой зар дээр худалдан авагч ойлгохуйц дэлгэрэнгүй тайлбар оруулна уу';
  if (imageUrls.length < 3) return 'Машин, байр, төсөл зэрэг тусгай зар дээр хамгийн багадаа 3 зураг оруулна уу';

  const missing = (REQUIRED_SPECIAL_METADATA_KEYS[entityType] || []).filter(
    (key) => !hasMetadataValue(metadata, key)
  );
  return missing.length > 0
    ? `Тусгай зарын заавал бөглөх мэдээлэл дутуу байна: ${missing.join(', ')}`
    : null;
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return errorJson('Буруу зарын ID', 400);

  const ownedWhere = await buildOwnedFeedWhere(auth.id);
  const item = await prisma.feedItem.findFirst({
    where: { id, AND: [ownedWhere] },
    select: { id: true },
  });
  if (!item) return errorJson('Зар олдсонгүй эсвэл эрх хүрэхгүй байна', 404);

  await prisma.entityMedia.deleteMany({ where: { feedItemId: id } });
  await prisma.feedItem.delete({ where: { id } });

  return json({ id });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return errorJson('Буруу зарын ID', 400);

  const ownedWhere = await buildOwnedFeedWhere(auth.id);
  const item = await prisma.feedItem.findFirst({
    where: { id, AND: [ownedWhere] },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!item) return errorJson('Зар олдсонгүй эсвэл эрх хүрэхгүй байна', 404);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const entityType = item.entityType;
    const nextTitle = hasField(body, 'title') ? cleanString(body.title) : item.title;
    const nextDescription = hasField(body, 'description')
      ? cleanString(body.description)
      : item.description || '';
    const nextDistrict = hasField(body, 'district') ? cleanString(body.district) : item.district || '';
    const nextProvince = hasField(body, 'province') ? cleanString(body.province) : item.province || '';
    const nextSubcategory = hasField(body, 'subcategory') ? cleanString(body.subcategory) : item.subcategory || '';
    const nextTier = hasField(body, 'tier') && VALID_TIERS.has(cleanString(body.tier))
      ? cleanString(body.tier)
      : item.tier;
    const nextPrice = hasField(body, 'price') ? toOptionalNumber(body.price) : item.price;
    const nextOriginalPrice = hasField(body, 'originalPrice')
      ? toOptionalNumber(body.originalPrice)
      : item.originalPrice;
    const nextLat = hasField(body, 'lat') ? toOptionalNumber(body.lat) : item.lat;
    const nextLng = hasField(body, 'lng') ? toOptionalNumber(body.lng) : item.lng;
    const nextImageUrls = sanitizeImageUrls(hasField(body, 'images') ? normalizeMediaUrls(body.images) : item.images);
    const mergedMetadata = hasField(body, 'metadata')
      ? { ...objectRecord(item.metadata), ...objectRecord(body.metadata) }
      : objectRecord(item.metadata);
    const nextMetadata = normalizeMetadata(mergedMetadata, entityType, nextDistrict, nextPrice);
    const nextCategory = hasField(body, 'category')
      ? cleanString(body.category) || defaultCategory(entityType, nextMetadata)
      : item.category || defaultCategory(entityType, nextMetadata);

    if (!nextTitle) return errorJson('Гарчиг шаардлагатай');

    const validationError = validateSpecialListing(
      entityType,
      nextDescription,
      nextImageUrls,
      nextMetadata
    );
    if (validationError) return errorJson(validationError);

    const updated = await prisma.feedItem.update({
      where: { id },
      data: {
        title: nextTitle,
        description: nextDescription || null,
        price: nextPrice,
        originalPrice: nextOriginalPrice,
        images: nextImageUrls,
        category: nextCategory || null,
        subcategory: nextSubcategory || null,
        tier: nextTier,
        district: nextDistrict || null,
        province: nextProvince || null,
        lat: nextLat,
        lng: nextLng,
        metadata: nextMetadata as Prisma.InputJsonValue,
      },
    });

    const shouldSyncMedia = ['images', 'videoUrl', 'virtualTourUrl', 'floorPlanUrl'].some((key) =>
      hasField(body, key)
    );
    if (shouldSyncMedia) {
      const videoUrl = sanitizeImageUrls([hasField(body, 'videoUrl')
        ? cleanString(body.videoUrl)
        : item.media.find((media) => media.type === 'VIDEO')?.url || ''])[0] || '';
      const virtualTourUrl = sanitizeImageUrls([hasField(body, 'virtualTourUrl')
        ? cleanString(body.virtualTourUrl)
        : item.media.find((media) => media.type === 'VIRTUAL_TOUR')?.url || ''])[0] || '';
      const floorPlanUrl = sanitizeImageUrls([hasField(body, 'floorPlanUrl')
        ? cleanString(body.floorPlanUrl)
        : item.media.find((media) => media.type === 'FLOOR_PLAN')?.url || ''])[0] || '';
      const mediaRows = [
        ...nextImageUrls.map((url, sortOrder) => ({ feedItemId: id, type: 'IMAGE', url, sortOrder })),
        ...(videoUrl ? [{ feedItemId: id, type: 'VIDEO', url: videoUrl, sortOrder: nextImageUrls.length }] : []),
        ...(virtualTourUrl ? [{ feedItemId: id, type: 'VIRTUAL_TOUR', url: virtualTourUrl, sortOrder: nextImageUrls.length + 1 }] : []),
        ...(floorPlanUrl ? [{ feedItemId: id, type: 'FLOOR_PLAN', url: floorPlanUrl, sortOrder: nextImageUrls.length + 2 }] : []),
      ].filter((row) => row.url.trim());

      await prisma.entityMedia.deleteMany({ where: { feedItemId: id } });
      if (mediaRows.length > 0) await prisma.entityMedia.createMany({ data: mediaRows });
    }

    const itemWithMedia = await prisma.feedItem.findUnique({
      where: { id: updated.id },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    });

    return json(itemWithMedia || updated);
  } catch (err: unknown) {
    const error = err as { message?: string };
    return errorJson('Зар шинэчлэхэд алдаа: ' + (error.message || ''));
  }
}
