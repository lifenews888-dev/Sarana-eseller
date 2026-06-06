/**
 * Shop Config Cache Layer — Upstash Redis
 * Edge-compatible. Falls back to direct DB on Redis failure.
 */

import { Redis } from '@upstash/redis';
import { prisma } from './prisma';

const CACHE_TTL = 3600; // 1 цаг
const NULL_TTL = 300;   // 5 минут (олдохгүй бол)

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_KV_REST_API_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

async function getCached<T>(key: string): Promise<T | null | undefined> {
  const redis = getRedis();
  if (!redis) return undefined;

  try {
    return await redis.get<T>(key);
  } catch {
    return undefined;
  }
}

async function setCached(key: string, value: unknown, ttl: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttl });
  } catch {}
}

async function deleteCached(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch {}
}

export interface ShopConfig {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  plan: string;
  isActive: boolean;
  phone: string | null;
  address: string | null;
  ownerId: string;
}

/** Get shop config by subdomain slug — cached */
export async function getShopConfig(slug: string): Promise<ShopConfig | null> {
  const key = `shop:${slug}`;

  // 1. Redis cache
  const cached = await getCached<ShopConfig>(key);
  if (cached !== null && cached !== undefined) return cached;

  // 2. DB lookup — enterprise shop
  const enterprise = await prisma.enterpriseShop.findFirst({
    where: {
      OR: [{ subdomain: slug }, { shop: { slug } }],
      isActive: true,
    },
    include: {
      shop: {
        select: {
          id: true, name: true, slug: true, phone: true,
          address: true, userId: true, logo: true,
        },
      },
    },
  });

  if (enterprise) {
    const config: ShopConfig = {
      id: enterprise.id,
      shopId: enterprise.shopId,
      name: enterprise.shop.name,
      slug: enterprise.subdomain,
      primaryColor: enterprise.primaryColor,
      accentColor: enterprise.accentColor,
      logoUrl: enterprise.logoUrl || enterprise.shop.logo,
      faviconUrl: enterprise.faviconUrl,
      plan: enterprise.plan,
      isActive: enterprise.isActive,
      phone: enterprise.shop.phone,
      address: enterprise.shop.address,
      ownerId: enterprise.shop.userId,
    };
    await setCached(key, config, CACHE_TTL);
    return config;
  }

  // 3. Fallback — regular shop (no enterprise setup)
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ slug }, { storefrontSlug: slug }],
      isBlocked: false,
    },
    select: {
      id: true, name: true, slug: true, phone: true,
      address: true, userId: true, logo: true,
    },
  });

  if (!shop) {
    await setCached(key, null, NULL_TTL);
    return null;
  }

  const config: ShopConfig = {
    id: shop.id,
    shopId: shop.id,
    name: shop.name,
    slug: shop.slug,
    primaryColor: '#1B3A5C',
    accentColor: '#E8242C',
    logoUrl: shop.logo,
    faviconUrl: null,
    plan: 'FREE',
    isActive: true,
    phone: shop.phone,
    address: shop.address,
    ownerId: shop.userId,
  };

  await setCached(key, config, CACHE_TTL);
  return config;
}

/** Get shop config by custom domain — cached */
export async function getShopByDomain(domain: string): Promise<ShopConfig | null> {
  const key = `domain:${domain}`;

  const cached = await getCached<ShopConfig>(key);
  if (cached !== null && cached !== undefined) return cached;

  const enterprise = await prisma.enterpriseShop.findFirst({
    where: { customDomain: domain, isActive: true },
    include: {
      shop: {
        select: {
          id: true, name: true, slug: true, phone: true,
          address: true, userId: true, logo: true,
        },
      },
    },
  });

  if (!enterprise) {
    await setCached(key, null, NULL_TTL);
    return null;
  }

  const config: ShopConfig = {
    id: enterprise.id,
    shopId: enterprise.shopId,
    name: enterprise.shop.name,
    slug: enterprise.subdomain,
    primaryColor: enterprise.primaryColor,
    accentColor: enterprise.accentColor,
    logoUrl: enterprise.logoUrl || enterprise.shop.logo,
    faviconUrl: enterprise.faviconUrl,
    plan: enterprise.plan,
    isActive: enterprise.isActive,
    phone: enterprise.shop.phone,
    address: enterprise.shop.address,
    ownerId: enterprise.shop.userId,
  };

  await setCached(key, config, CACHE_TTL);
  return config;
}

/** Invalidate cache when shop config changes */
export async function invalidateShopCache(slug: string): Promise<void> {
  await deleteCached(`shop:${slug}`);
}

export async function invalidateDomainCache(domain: string): Promise<void> {
  await deleteCached(`domain:${domain}`);
}
