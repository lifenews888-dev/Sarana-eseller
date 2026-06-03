import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type StoreEntityType = 'store' | 'agent' | 'company' | 'auto_dealer' | 'service';

interface StoreListing {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  logo?: string | null;
  phone?: string | null;
  address?: string | null;
  industry?: string | null;
  district?: string | null;
  entityType: StoreEntityType;
  storeType?: string;
  isVerified: boolean;
  serviceCount?: number;
  specialties?: string[];
  rating?: number | null;
  reviewCount?: number | null;
  employeeCount?: number | null;
  brands?: string[];
  serviceTypes?: string[];
  createdAt: Date;
}

/**
 * GET /api/stores — Unified store/entity listing
 *
 * Query params:
 *   type     — filter by entity type: store|agent|company|auto_dealer|service|all (default: all)
 *   district — filter by district
 *   search   — search by name
 *   sort     — popular|newest|rating (default: newest)
 *   page     — page number (default: 1)
 *   limit    — items per page (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all';
    const district = url.searchParams.get('district') || '';
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const stores: StoreListing[] = [];

    // Hide test shops/users from public listings
    const HIDE_TEST: Prisma.ShopWhereInput = {
      AND: [
        { NOT: { slug: { startsWith: 'test-' } } },
        { NOT: { name: { contains: 'test', mode: 'insensitive' as const } } },
      ],
    };

    // ─── Shops (product/service/hybrid stores) ───────────
    if (type === 'all' || type === 'store') {
      const where: Prisma.ShopWhereInput = { ...HIDE_TEST };
      if (search) where.name = { contains: search, mode: 'insensitive' };
      if (district) where.district = district;

      const shops = await prisma.shop.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          shopType: true,
          services: { select: { id: true } },
        },
        orderBy: sort === 'newest' ? { createdAt: 'desc' } : { name: 'asc' },
        skip,
        take: limit,
      });

      for (const shop of shops) {
        stores.push({
          id: shop.id,
          ownerId: shop.userId,
          name: shop.name,
          slug: shop.slug,
          logo: shop.logo,
          phone: shop.phone,
          address: shop.address,
          industry: shop.industry,
          district: shop.district,
          entityType: 'store',
          storeType: shop.shopType?.type || 'product',
          isVerified: shop.locationStatus === 'verified',
          serviceCount: shop.services.length,
          createdAt: shop.createdAt,
        });
      }
    }

    // ─── Agents (real estate) ────────────────────────────
    if (type === 'all' || type === 'agent') {
      const where: Prisma.AgentWhereInput = {};
      if (search) where.name = { contains: search, mode: 'insensitive' };
      if (district) where.district = district;

      const agents = await prisma.agent.findMany({
        where,
        orderBy: sort === 'rating' ? { rating: 'desc' } : sort === 'newest' ? { createdAt: 'desc' } : { name: 'asc' },
        skip,
        take: limit,
      });

      for (const agent of agents) {
        stores.push({
          id: agent.id,
          ownerId: agent.userId,
          name: agent.name,
          slug: agent.slug,
          logo: agent.profilePhoto,
          phone: agent.phone,
          address: agent.address,
          district: agent.district,
          entityType: 'agent',
          specialties: agent.specialties,
          isVerified: agent.isVerified,
          rating: agent.rating,
          reviewCount: agent.reviewCount,
          createdAt: agent.createdAt,
        });
      }
    }

    // ─── Companies (construction) ────────────────────────
    if (type === 'all' || type === 'company') {
      const where: Prisma.CompanyWhereInput = {};
      if (search) where.name = { contains: search, mode: 'insensitive' };
      if (district) where.district = district;

      const companies = await prisma.company.findMany({
        where,
        orderBy: sort === 'rating' ? { rating: 'desc' } : sort === 'newest' ? { createdAt: 'desc' } : { name: 'asc' },
        skip,
        take: limit,
      });

      for (const company of companies) {
        stores.push({
          id: company.id,
          ownerId: company.userId,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          phone: company.phone,
          address: company.address,
          district: company.district,
          entityType: 'company',
          isVerified: company.isVerified,
          rating: company.rating,
          reviewCount: company.reviewCount,
          employeeCount: company.employeeCount,
          createdAt: company.createdAt,
        });
      }
    }

    // ─── Auto Dealers ────────────────────────────────────
    if (type === 'all' || type === 'auto_dealer') {
      const where: Prisma.AutoDealerWhereInput = {};
      if (search) where.name = { contains: search, mode: 'insensitive' };
      if (district) where.district = district;

      const dealers = await prisma.autoDealer.findMany({
        where,
        orderBy: sort === 'rating' ? { rating: 'desc' } : sort === 'newest' ? { createdAt: 'desc' } : { name: 'asc' },
        skip,
        take: limit,
      });

      for (const dealer of dealers) {
        stores.push({
          id: dealer.id,
          ownerId: dealer.userId,
          name: dealer.name,
          slug: dealer.slug,
          logo: dealer.logo,
          phone: dealer.phone,
          address: dealer.address,
          district: dealer.district,
          entityType: 'auto_dealer',
          brands: dealer.brands,
          isVerified: dealer.isVerified,
          rating: dealer.rating,
          reviewCount: dealer.reviewCount,
          createdAt: dealer.createdAt,
        });
      }
    }

    // ─── Service Providers ───────────────────────────────
    if (type === 'all' || type === 'service') {
      const where: Prisma.ServiceProviderWhereInput = {};
      if (search) where.name = { contains: search, mode: 'insensitive' };
      if (district) where.district = district;

      const providers = await prisma.serviceProvider.findMany({
        where,
        orderBy: sort === 'rating' ? { rating: 'desc' } : sort === 'newest' ? { createdAt: 'desc' } : { name: 'asc' },
        skip,
        take: limit,
      });

      for (const provider of providers) {
        stores.push({
          id: provider.id,
          ownerId: provider.userId,
          name: provider.name,
          slug: provider.slug,
          logo: provider.logo,
          phone: provider.phone,
          address: provider.address,
          district: provider.district,
          entityType: 'service',
          serviceTypes: provider.serviceTypes,
          isVerified: provider.isVerified,
          rating: provider.rating,
          reviewCount: provider.reviewCount,
          createdAt: provider.createdAt,
        });
      }
    }

    // Sort combined results
    if (sort === 'rating') {
      stores.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'newest') {
      stores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({
      stores,
      total: stores.length,
      page,
      limit,
    });
  } catch (error: unknown) {
    // Return empty array on DB error so frontend uses fallback
    console.warn('Stores API error:', (error as Error).message);
    return NextResponse.json({ stores: [], total: 0, page: 1, limit: 20 });
  }
}
