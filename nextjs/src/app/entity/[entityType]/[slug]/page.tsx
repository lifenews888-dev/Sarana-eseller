'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ENTITY_LABELS, type EntityType } from '@/lib/types/entity';
import { listingMetadataPreviewItems, metadataFieldsForCategory } from '@/lib/listingMetadata';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import SafeImage from '@/components/ui/SafeImage';
import {
  MapPin, Phone, Star, Shield,
  Calendar, MessageCircle, Clock, Award, Heart,
  Share2, Fuel, Gauge, DoorOpen, Ruler, CheckCircle2,
  Mail, Globe, X, Search, Camera, BookOpen,
  ArrowRight,
} from 'lucide-react';

type FeedCardMetadata = Record<string, unknown>;

/* ═══════════════════════════════════════════════════════════════
   DEMO DATA — Rich profiles with real images
   ═══════════════════════════════════════════════════════════════ */

interface DemoVehicle {
  id: string; title: string; price: number; year: number; mileage: number;
  fuel: string; image: string; badge?: string; sold?: boolean;
  category?: string; metadata?: FeedCardMetadata;
}

interface DemoProject {
  id: string; title: string; status: string; progress: number;
  image: string; units: number; priceFrom: number; location: string; year: string;
  category?: string; metadata?: FeedCardMetadata;
}

interface DemoListing {
  id: string; title: string; price: number; image: string;
  sqm: number; rooms: number; district: string; badge?: string;
  category?: string; metadata?: FeedCardMetadata;
}

interface DemoEntity {
  name: string; slug: string; type: EntityType;
  logo?: string; coverImage: string; coverImages?: string[];
  description: string; phone: string; district: string;
  isVerified: boolean; rating: number; reviewCount: number;
  stats: { label: string; value: string }[];
  // Type-specific
  brands?: string[]; vehicles?: DemoVehicle[]; gallery?: string[];
  projects?: DemoProject[]; milestones?: { year: string; text: string }[];
  specialties?: string[]; experience?: number; listings?: DemoListing[];
  testimonials?: { name: string; text: string; rating: number }[];
  services?: string[]; awards?: string[];
  website?: string; email?: string; social?: { ig?: string; fb?: string };
}

interface ApiEntityProfile {
  id?: string;
  type?: EntityType | string;
  name?: string;
  slug?: string;
  logo?: string | null;
  profilePhoto?: string | null;
  coverImage?: string | null;
  description?: string | null;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  isVerified?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
  brands?: string[] | null;
  specialties?: string[] | null;
  experience?: number | null;
  website?: string | null;
  email?: string | null;
}

interface ApiFeedItem {
  id: string;
  title: string;
  category?: string | null;
  price?: number | null;
  images?: string[] | null;
  media?: { type?: string | null; url?: string | null; thumbnail?: string | null }[] | null;
  metadata?: Record<string, unknown> | null;
  district?: string | null;
  tier?: string | null;
}

interface ApiEntityResponse {
  entity?: ApiEntityProfile | null;
  feedItems?: ApiFeedItem[] | null;
}

const DEMO: Record<string, Record<string, DemoEntity>> = {
  auto_dealer: {
    autocity: {
      name: 'AutoCity Mongolia', slug: 'autocity', type: 'auto_dealer',
      logo: 'https://picsum.photos/seed/eseller-200/200',
      coverImage: 'https://picsum.photos/seed/eseller-1400/1400',
      coverImages: [
        'https://picsum.photos/seed/eseller-1400/1400',
        'https://picsum.photos/seed/eseller-1400/1400',
        'https://picsum.photos/seed/eseller-1400/1400',
      ],
      description: 'Монголын тэргүүлэгч автомашин импортлогч, борлуулагч. 2015 оноос хойш 5,000+ машин амжилттай борлуулсан. Toyota, Hyundai, Kia, Honda, BMW брэндүүдийн албан ёсны дилер.',
      phone: '7700-8899', district: 'БЗД', isVerified: true, rating: 4.8, reviewCount: 312,
      website: 'autocity.mn', email: 'info@autocity.mn', social: { ig: '@autocity_mn', fb: 'AutoCityMN' },
      brands: ['Toyota', 'Hyundai', 'Kia', 'Honda', 'BMW', 'Mercedes'],
      stats: [
        { label: 'Борлуулсан', value: '5,200+' },
        { label: 'Жилийн туршлага', value: '11' },
        { label: 'Одоо байгаа', value: '48' },
        { label: 'Сэтгэл ханамж', value: '98%' },
      ],
      vehicles: [
        { id: 'v1', title: 'Toyota Land Cruiser 300', price: 185000000, year: 2024, mileage: 5000, fuel: 'Дизель', image: 'https://picsum.photos/seed/eseller-600/600', badge: 'Шинэ' },
        { id: 'v2', title: 'BMW X5 xDrive40i', price: 145000000, year: 2023, mileage: 18000, fuel: 'Бензин', image: 'https://picsum.photos/seed/eseller-600/600', badge: 'Premium' },
        { id: 'v3', title: 'Toyota Prius 2023', price: 52000000, year: 2023, mileage: 12000, fuel: 'Hybrid', image: 'https://picsum.photos/seed/eseller-600/600' },
        { id: 'v4', title: 'Hyundai Tucson 2024', price: 78000000, year: 2024, mileage: 3000, fuel: 'Бензин', image: 'https://picsum.photos/seed/eseller-600/600', badge: 'Шинэ' },
        { id: 'v5', title: 'Kia Sportage 2023', price: 65000000, year: 2023, mileage: 22000, fuel: 'Бензин', image: 'https://picsum.photos/seed/eseller-600/600' },
        { id: 'v6', title: 'Honda CR-V 2022', price: 58000000, year: 2022, mileage: 35000, fuel: 'Бензин', image: 'https://picsum.photos/seed/eseller-600/600', sold: true },
      ],
      gallery: [
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
      ],
      testimonials: [
        { name: 'Б. Мөнхбат', text: 'Маш найдвартай, чанартай машин авсан. Баримт бичиг бүрэн, баталгаатай.', rating: 5 },
        { name: 'О. Сарангэрэл', text: 'Анхны машинаа авахад маш сайн зөвлөгөө өгсөн. Үнэхээр мэргэжлийн.', rating: 5 },
        { name: 'Д. Ганбаатар', text: 'Prius маш сайн нөхцөлтэй байсан. Үнэ нь зах зээлийн дунджаас хямд.', rating: 4 },
      ],
      awards: ['Шилдэг автодилер 2025', 'Хэрэглэгчийн итгэлийн шагнал'],
    },
  },
  company: {
    'mongolian-properties': {
      name: 'Монголиан Пропертиз', slug: 'mongolian-properties', type: 'company',
      logo: 'https://picsum.photos/seed/eseller-200/200',
      coverImage: 'https://picsum.photos/seed/eseller-1400/1400',
      coverImages: [
        'https://picsum.photos/seed/eseller-1400/1400',
        'https://picsum.photos/seed/eseller-1400/1400',
        'https://picsum.photos/seed/eseller-1400/1400',
      ],
      description: '2010 оноос хойш 15+ амины орон сууцны төсөл амжилттай хэрэгжүүлсэн. 3,000+ гэр бүлд орон сууцтай болоход тусалсан. ISO 9001 чанарын удирдлагын тогтолцоотой.',
      phone: '7012-3456', district: 'ХУД', isVerified: true, rating: 4.7, reviewCount: 189,
      website: 'mongolianproperties.mn', email: 'info@mp.mn',
      stats: [
        { label: 'Төсөл', value: '15+' },
        { label: 'Айлын тоо', value: '3,200+' },
        { label: 'Жилийн туршлага', value: '16' },
        { label: 'Ажилтан', value: '120+' },
      ],
      projects: [
        { id: 'p1', title: 'Zaisan Heights', status: 'Борлуулж байна', progress: 75, image: 'https://picsum.photos/seed/eseller-600/600', units: 240, priceFrom: 95000000, location: 'ХУД, Зайсан', year: '2027' },
        { id: 'p2', title: 'Central Park Residence', status: 'Барьж байна', progress: 45, image: 'https://picsum.photos/seed/eseller-600/600', units: 180, priceFrom: 120000000, location: 'СБД, 1-р хороолол', year: '2028' },
        { id: 'p3', title: 'Green Valley', status: 'Ашиглалтад орсон', progress: 100, image: 'https://picsum.photos/seed/eseller-600/600', units: 320, priceFrom: 78000000, location: 'БГД, 3-р хороолол', year: '2025' },
        { id: 'p4', title: 'River Garden II', status: 'Төлөвлөж байна', progress: 10, image: 'https://picsum.photos/seed/eseller-600/600', units: 150, priceFrom: 135000000, location: 'СБД, Туул голын эрэг', year: '2029' },
      ],
      milestones: [
        { year: '2010', text: 'Компани үүсгэн байгуулагдсан' },
        { year: '2014', text: 'Эхний төсөл "Sky Tower" ашиглалтад орсон' },
        { year: '2018', text: 'ISO 9001 гэрчилгээ авсан' },
        { year: '2022', text: '"Шилдэг барилгын компани" шагнал' },
        { year: '2025', text: 'Green Valley төсөл дууссан, 320 айл' },
      ],
      awards: ['Шилдэг барилгын компани 2022', 'ISO 9001:2015', 'Шилдэг ажил олгогч 2024'],
      gallery: [
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
        'https://picsum.photos/seed/eseller-600/600',
      ],
      testimonials: [
        { name: 'Г. Батбаяр', text: 'Green Valley-д орон сууц авсан. Чанар маш сайн, цаг хугацаандаа хүлээлгэж өгсөн.', rating: 5 },
        { name: 'Э. Оюунчимэг', text: 'Банкны зээлийн зөвлөгөө маш их тусалсан. Мэргэжлийн хандлага.', rating: 5 },
      ],
    },
  },
  agent: {
    erdenbat: {
      name: 'Б. Эрдэнэбат', slug: 'erdenbat', type: 'agent',
      logo: 'https://picsum.photos/seed/eseller-200/200',
      coverImage: 'https://picsum.photos/seed/eseller-1400/1400',
      coverImages: [
        'https://picsum.photos/seed/eseller-1400/1400',
        'https://picsum.photos/seed/eseller-1400/1400',
      ],
      description: 'Үл хөдлөх хөрөнгийн чиглэлээр 12 жил ажилласан мэргэжлийн лицензтэй агент. 800+ амжилттай хэлцэл. Орон сууц, оффис, газар зуучлал.',
      phone: '9911-2233', district: 'СБД', isVerified: true, rating: 4.9, reviewCount: 87,
      experience: 12,
      specialties: ['Орон сууц', 'Оффис', 'Газар', 'Үнэлгээ'],
      stats: [
        { label: 'Хэлцэл', value: '800+' },
        { label: 'Туршлага', value: '12 жил' },
        { label: 'Идэвхтэй зар', value: '24' },
        { label: 'Үнэлгээ', value: '4.9★' },
      ],
      listings: [
        { id: 'l1', title: '3 өрөө байр, Ривер Гарден', price: 450000000, image: 'https://picsum.photos/seed/eseller-600/600', sqm: 98, rooms: 3, district: 'СБД', badge: 'VIP' },
        { id: 'l2', title: '2 өрөө, 13-р хороолол', price: 180000000, image: 'https://picsum.photos/seed/eseller-600/600', sqm: 65, rooms: 2, district: 'БЗД' },
        { id: 'l3', title: '4 өрөө пентхаус, Zaisan', price: 780000000, image: 'https://picsum.photos/seed/eseller-600/600', sqm: 180, rooms: 4, district: 'ХУД', badge: 'Premium' },
        { id: 'l4', title: 'Оффис, Central Tower', price: 3500000, image: 'https://picsum.photos/seed/eseller-600/600', sqm: 120, rooms: 0, district: 'СБД' },
        { id: 'l5', title: '1 өрөө студио, Хан-Уул', price: 95000000, image: 'https://picsum.photos/seed/eseller-600/600', sqm: 38, rooms: 1, district: 'ХУД' },
        { id: 'l6', title: 'Газар 500м², Налайх', price: 45000000, image: 'https://picsum.photos/seed/eseller-600/600', sqm: 500, rooms: 0, district: 'НД' },
      ],
      testimonials: [
        { name: 'С. Нарангэрэл', text: 'Эрдэнэбат маш мэргэжлийн, цаг алдалгүй ажилласан. Гэрийн маань үнийг зөв тогтоож, хурдан зарсан.', rating: 5 },
        { name: 'Б. Ганзориг', text: 'Байр авахад тусалсан, бүх процессыг тайлбарлаж өгсөн. Итгэлтэй хүн.', rating: 5 },
        { name: 'Д. Оюунтуяа', text: 'Оффис хайхад маш олон сонголт санал болгосон. Хурдан шийдвэрлэсэн.', rating: 4 },
      ],
    },
  },
};

/* ═══ Helpers ═══ */
function formatPrice(n: number) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' тэрбум';
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + ' сая';
  return n.toLocaleString();
}

function feedDetailHref(id: string): string {
  return `/feed/${encodeURIComponent(id)}`;
}

function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[,\s₮]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function stringFrom(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function firstImage(item: ApiFeedItem, seed: string): string {
  return (
    item.images?.find((url) => typeof url === 'string' && url.trim()) ||
    item.media?.find((media) => media.type === 'IMAGE' && media.url)?.url ||
    item.media?.find((media) => media.thumbnail)?.thumbnail ||
    `https://picsum.photos/seed/${seed}/600/600`
  );
}

function badgeFromTier(tier?: string | null): string | undefined {
  if (tier === 'vip') return 'VIP';
  if (tier === 'featured') return 'Premium';
  return undefined;
}

function mapVehicle(item: ApiFeedItem): DemoVehicle {
  const meta = item.metadata || {};
  return {
    id: item.id,
    title: item.title,
    price: numberFrom(item.price),
    year: numberFrom(meta.year),
    mileage: numberFrom(meta.mileage),
    fuel: stringFrom(meta.fuelType, stringFrom(meta.fuel, '')),
    image: firstImage(item, `vehicle-${item.id}`),
    badge: badgeFromTier(item.tier),
    category: item.category || undefined,
    metadata: meta,
  };
}

function mapProject(item: ApiFeedItem): DemoProject {
  const meta = item.metadata || {};
  const totalUnits = numberFrom(meta.totalUnits, numberFrom(meta.units));
  const soldUnits = numberFrom(meta.soldUnits);
  const progress = totalUnits > 0 ? Math.min(100, Math.round((soldUnits / totalUnits) * 100)) : 0;
  return {
    id: item.id,
    title: item.title,
    status: stringFrom(meta.projectStatus, 'Идэвхтэй'),
    progress,
    image: firstImage(item, `project-${item.id}`),
    units: totalUnits,
    priceFrom: numberFrom(item.price, numberFrom(meta.pricePerSqm)),
    location: stringFrom(meta.address, item.district || ''),
    year: stringFrom(meta.completionDate, ''),
    category: item.category || undefined,
    metadata: meta,
  };
}

function mapListing(item: ApiFeedItem): DemoListing {
  const meta = item.metadata || {};
  return {
    id: item.id,
    title: item.title,
    price: numberFrom(item.price),
    image: firstImage(item, `listing-${item.id}`),
    sqm: numberFrom(meta.sqm, numberFrom(meta.area)),
    rooms: numberFrom(meta.rooms),
    district: item.district || stringFrom(meta.district, ''),
    badge: badgeFromTier(item.tier),
    category: item.category || undefined,
    metadata: meta,
  };
}

function compactMetadataPreviewItems(
  category: string | undefined,
  metadata: FeedCardMetadata | undefined,
  limit: number,
  skipKeys: string[] = [],
) {
  if (!metadata) return [];
  const fields = metadataFieldsForCategory(category);
  return listingMetadataPreviewItems(fields, metadata, limit + skipKeys.length + 4)
    .filter((item) => !skipKeys.includes(item.key))
    .slice(0, limit);
}

function vehicleFallbackMetadata(vehicle: DemoVehicle): FeedCardMetadata {
  const titleParts = vehicle.title.split(/\s+/).filter(Boolean);
  const brand = titleParts[0] || '';
  const model = titleParts.slice(1).join(' ');

  return {
    brand,
    model,
    year: vehicle.year,
    mileage: vehicle.mileage,
    fuelType: vehicle.fuel,
  };
}

function projectFallbackMetadata(project: DemoProject): FeedCardMetadata {
  const soldUnits = Math.round((project.units * project.progress) / 100);
  const availableUnits = Math.max(project.units - soldUnits, 0);

  return {
    projectStatus: project.status,
    address: project.location,
    totalUnits: project.units,
    soldUnits,
    availableUnits,
    pricePerSqm: project.priceFrom,
    completionDate: project.year,
  };
}

function listingFallbackMetadata(listing: DemoListing): FeedCardMetadata {
  const title = listing.title.toLowerCase();
  const propertyType = title.includes('оффис')
    ? 'Оффис'
    : title.includes('газар')
    ? 'Газар'
    : title.includes('пентхаус')
    ? 'Пентхаус'
    : 'Орон сууц';

  return {
    propertyType,
    listingType: title.includes('түрээс') ? 'Түрээслэх' : 'Худалдах',
    sqm: listing.sqm,
    rooms: listing.rooms,
    district: listing.district,
  };
}

function buildLiveStats(entityType: string, count: number, base?: DemoEntity): DemoEntity['stats'] {
  if (base?.stats?.length) return base.stats;
  if (entityType === 'auto_dealer') {
    return [{ label: 'Одоо байгаа', value: `${count}` }, { label: 'Баталгаатай', value: '✓' }];
  }
  if (entityType === 'company') {
    return [{ label: 'Төсөл', value: `${count}` }, { label: 'Баталгаатай', value: '✓' }];
  }
  return [{ label: 'Идэвхтэй зар', value: `${count}` }, { label: 'Баталгаатай', value: '✓' }];
}

function mergeLiveEntity(entityType: string, slug: string, payload: ApiEntityResponse, base?: DemoEntity): DemoEntity | null {
  if (!payload.entity) return base || null;
  const api = payload.entity;
  const feedItems = payload.feedItems || [];
  const fallbackCover = feedItems[0] ? firstImage(feedItems[0], `entity-${slug}`) : 'https://picsum.photos/seed/eseller-1400/1400';
  const mapped: DemoEntity = {
    name: api.name || base?.name || slug,
    slug: api.slug || base?.slug || slug,
    type: (api.type as EntityType) || (entityType as EntityType),
    logo: api.profilePhoto || api.logo || base?.logo,
    coverImage: api.coverImage || base?.coverImage || fallbackCover,
    coverImages: base?.coverImages || [api.coverImage || fallbackCover],
    description: api.description || api.bio || base?.description || '',
    phone: api.phone || base?.phone || '',
    district: api.district || base?.district || '',
    isVerified: Boolean(api.isVerified ?? base?.isVerified),
    rating: api.rating ?? base?.rating ?? 0,
    reviewCount: api.reviewCount ?? base?.reviewCount ?? 0,
    stats: buildLiveStats(entityType, feedItems.length, base),
    brands: api.brands || base?.brands,
    specialties: api.specialties || base?.specialties,
    experience: api.experience ?? base?.experience,
    gallery: base?.gallery,
    milestones: base?.milestones,
    testimonials: base?.testimonials,
    services: base?.services,
    awards: base?.awards,
    website: api.website || base?.website,
    email: api.email || base?.email,
    social: base?.social,
  };

  if (entityType === 'auto_dealer') mapped.vehicles = feedItems.length ? feedItems.map(mapVehicle) : base?.vehicles;
  if (entityType === 'company') mapped.projects = feedItems.length ? feedItems.map(mapProject) : base?.projects;
  if (entityType === 'agent') mapped.listings = feedItems.length ? feedItems.map(mapListing) : base?.listings;
  return mapped;
}

/* ═══ Hero Carousel ═══ */
function HeroCarousel({ images, label, children }: { images: string[]; label: string; children?: React.ReactNode }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div className="relative h-[340px] md:h-[420px] overflow-hidden">
      {images.map((img, i) => (
        <SafeImage
          key={i}
          src={img}
          alt={label}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000',
            i === idx ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      {images.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn('w-2 h-2 rounded-full transition-all border-none cursor-pointer', i === idx ? 'bg-[var(--esl-bg-card)] w-6' : 'bg-white/40')}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/* ═══ Vehicle Card ═══ */
function VehicleCard({ v }: { v: DemoVehicle }) {
  const meta = { ...vehicleFallbackMetadata(v), ...(v.metadata || {}) };
  const specItems = compactMetadataPreviewItems(
    v.category || 'vehicles',
    meta,
    4,
    ['year', 'mileage', 'fuelType', 'fuel'],
  );

  return (
    <Link
      href={feedDetailHref(v.id)}
      aria-label={`${v.title} дэлгэрэнгүй`}
      data-testid={`entity-vehicle-card-${v.id}`}
      className={cn(
      'group block no-underline min-w-[280px] max-w-[320px] rounded-2xl overflow-hidden border border-[var(--esl-border)] bg-[var(--esl-bg-section)] snap-start cursor-pointer transition-all hover:border-[#E8242C]/50 hover:shadow-[0_0_30px_rgba(232,36,44,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]',
      v.sold && 'opacity-60'
    )}>
      <div className="relative h-48 overflow-hidden">
        <SafeImage src={v.image} alt={v.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        {v.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#E8242C] text-white uppercase tracking-wider">
            {v.badge}
          </div>
        )}
        {v.sold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-black text-lg bg-black/60 px-4 py-2 rounded-xl">ЗАРАГДСАН</span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[var(--esl-bg-section)] to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#E8242C] transition-colors">{v.title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] font-semibold text-[var(--esl-text-muted)] bg-white/5 px-2 py-0.5 rounded">{v.year}</span>
          <span className="text-[10px] font-semibold text-[var(--esl-text-muted)] bg-white/5 px-2 py-0.5 rounded">{(v.mileage / 1000).toFixed(0)}к км</span>
          <span className="text-[10px] font-semibold text-[var(--esl-text-muted)] bg-white/5 px-2 py-0.5 rounded">{v.fuel}</span>
        </div>
        {specItems.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {specItems.map((item) => (
              <span key={item.key} className="min-w-0 rounded-lg bg-black/20 px-2 py-1 text-[10px] font-semibold text-[var(--esl-text-secondary)]">
                <span className="block truncate text-white/80">{item.value}</span>
                <span className="block truncate text-[var(--esl-text-muted)]">{item.label}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <p className="text-lg font-black text-[#E8242C]">{formatPrice(v.price)}₮</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 transition-colors group-hover:text-[#E8242C]">
            Дэлгэрэнгүй <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══ Project Card ═══ */
function ProjectCard({ p }: { p: DemoProject }) {
  const statusColor = p.progress === 100 ? 'text-green-400' : p.progress > 50 ? 'text-blue-400' : 'text-amber-400';
  const meta = { ...projectFallbackMetadata(p), ...(p.metadata || {}) };
  const specItems = compactMetadataPreviewItems(
    p.category || 'new-buildings',
    meta,
    4,
    ['projectStatus', 'address', 'totalUnits', 'soldUnits', 'pricePerSqm', 'completionDate'],
  );

  return (
    <Link
      href={feedDetailHref(p.id)}
      aria-label={`${p.title} дэлгэрэнгүй`}
      data-testid={`entity-project-card-${p.id}`}
      className="group block no-underline rounded-2xl overflow-hidden border border-[var(--esl-border)] bg-[var(--esl-bg-section)] hover:border-white/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]"
    >
      <div className="relative h-52 overflow-hidden">
        <SafeImage src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--esl-bg-section)] via-transparent to-transparent" />
        <div className={cn('absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider', statusColor, 'bg-black/60')}>
          {p.status}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-base font-black text-white mb-1 group-hover:text-[#E8242C] transition-colors">{p.title}</h3>
        <p className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {p.location}</p>
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-[var(--esl-text-secondary)] mb-1">
            <span>Ахиц</span>
            <span className="font-bold text-white">{p.progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E8242C] to-[#FF6B6B] rounded-full transition-all" style={{ width: `${p.progress}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded-lg py-2">
            <p className="text-xs font-black text-white">{p.units}</p>
            <p className="text-[9px] text-[var(--esl-text-secondary)]">айл</p>
          </div>
          <div className="bg-white/5 rounded-lg py-2">
            <p className="text-xs font-black text-[#E8242C]">{formatPrice(p.priceFrom)}₮~</p>
            <p className="text-[9px] text-[var(--esl-text-secondary)]">эхлэх үнэ</p>
          </div>
          <div className="bg-white/5 rounded-lg py-2">
            <p className="text-xs font-black text-white">{p.year}</p>
            <p className="text-[9px] text-[var(--esl-text-secondary)]">он</p>
          </div>
        </div>
        {specItems.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {specItems.map((item) => (
              <span key={item.key} className="min-w-0 rounded-lg bg-black/20 px-2 py-1 text-[10px] font-semibold text-[var(--esl-text-secondary)]">
                <span className="block truncate text-white/80">{item.value}</span>
                <span className="block truncate text-[var(--esl-text-muted)]">{item.label}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-white/80 transition-colors group-hover:text-[#E8242C]">
          Дэлгэрэнгүй харах <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

/* ═══ Listing Card (Agent) ═══ */
function ListingCard({ l }: { l: DemoListing }) {
  const meta = { ...listingFallbackMetadata(l), ...(l.metadata || {}) };
  const specItems = compactMetadataPreviewItems(
    l.category || 'apartment',
    meta,
    5,
    ['sqm', 'rooms', 'district'],
  );

  return (
    <Link
      href={feedDetailHref(l.id)}
      aria-label={`${l.title} дэлгэрэнгүй`}
      data-testid={`entity-listing-card-${l.id}`}
      className="group block no-underline rounded-2xl overflow-hidden border border-[var(--esl-border)] bg-[var(--esl-bg-section)] hover:border-white/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]"
    >
      <div className="relative h-44 overflow-hidden">
        <SafeImage src={l.image} alt={l.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {l.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#D4AF37] text-black uppercase tracking-wider">
            {l.badge}
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[var(--esl-bg-section)] to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-[#E8242C] transition-colors">{l.title}</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {l.sqm > 0 && <span className="text-[10px] text-[var(--esl-text-muted)] bg-white/5 px-2 py-0.5 rounded flex items-center gap-1"><Ruler className="w-2.5 h-2.5" /> {l.sqm}м²</span>}
          {l.rooms > 0 && <span className="text-[10px] text-[var(--esl-text-muted)] bg-white/5 px-2 py-0.5 rounded flex items-center gap-1"><DoorOpen className="w-2.5 h-2.5" /> {l.rooms} өрөө</span>}
          {l.district && <span className="text-[10px] text-[var(--esl-text-muted)] bg-white/5 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {l.district}</span>}
        </div>
        {specItems.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {specItems.map((item) => (
              <span key={item.key} className="min-w-0 rounded-lg bg-black/20 px-2 py-1 text-[10px] font-semibold text-[var(--esl-text-secondary)]">
                <span className="block truncate text-white/80">{item.value}</span>
                <span className="block truncate text-[var(--esl-text-muted)]">{item.label}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <p className="text-base font-black text-[#E8242C]">{formatPrice(l.price)}₮</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 transition-colors group-hover:text-[#E8242C]">
            Дэлгэрэнгүй <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══ Testimonial Card ═══ */
function TestimonialCard({ t }: { t: { name: string; text: string; rating: number } }) {
  return (
    <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-5 min-w-[300px] snap-start">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn('w-3.5 h-3.5', i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-[#333]')} />
        ))}
      </div>
      <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed mb-3">&quot;{t.text}&quot;</p>
      <p className="text-xs font-bold text-[var(--esl-text-muted)]">— {t.name}</p>
    </div>
  );
}

/* ═══ Stat Card ═══ */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-[var(--esl-bg-elevated)] rounded-xl border border-[var(--esl-border)]">
      <p className="text-2xl font-black text-[var(--esl-text-primary)] mb-0.5">{value}</p>
      <p className="text-[11px] text-[var(--esl-text-secondary)] font-semibold">{label}</p>
    </div>
  );
}

/* ═══ MAIN PAGE ═══ */
export default function EntityProfilePage() {
  const params = useParams();
  const entityType = Array.isArray(params.entityType) ? params.entityType[0] : params.entityType as string;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug as string;
  const demoEntity = DEMO[entityType]?.[slug];
  const [activeTab, setActiveTab] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<DemoVehicle | null>(null);
  const [selectedProject, setSelectedProject] = useState<DemoProject | null>(null);
  const [selectedListing, setSelectedListing] = useState<DemoListing | null>(null);
  const [liveEntity, setLiveEntity] = useState<DemoEntity | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(() => !demoEntity);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entity = liveEntity || demoEntity;

  useEffect(() => {
    if (!entityType || !slug) return;
    let cancelled = false;
    fetch(`/api/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return await res.json() as ApiEntityResponse;
      })
      .then((payload) => {
        if (!cancelled && payload?.entity) {
          setLiveEntity(mergeLiveEntity(entityType, slug, payload, demoEntity));
        }
      })
      .catch(() => {
        if (!cancelled) setLiveEntity(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingEntity(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, slug, demoEntity]);

  if (!entity && loadingEntity) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-page)] flex items-center justify-center">
        <div className="text-center">
          <Search className="w-16 h-16 mb-4 mx-auto animate-pulse" style={{ color: 'var(--esl-text-muted)' }} />
          <h2 className="text-xl font-black text-white mb-2">Уншиж байна</h2>
          <p className="text-sm text-[var(--esl-text-muted)]">Дэлгүүрийн мэдээлэл болон заруудыг ачаалж байна</p>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-page)] flex items-center justify-center">
        <div className="text-center">
          <Search className="w-16 h-16 mb-4 mx-auto" style={{ color: 'var(--esl-text-muted)' }} />
          <h2 className="text-xl font-black text-white mb-2">Олдсонгүй</h2>
          <p className="text-sm text-[var(--esl-text-muted)] mb-4">Энэ хуудас байхгүй эсвэл устсан байна</p>
          <Link href="/feed" className="text-sm text-[#E8242C] font-bold no-underline hover:underline">← Зарын булан руу</Link>
        </div>
      </div>
    );
  }

  const tabs = entityType === 'auto_dealer'
    ? ['Машинууд', 'Галерей', 'Үнэлгээ', 'Тухай']
    : entityType === 'company'
    ? ['Төслүүд', 'Галерей', 'Үнэлгээ', 'Тухай']
    : ['Зарууд', 'Үнэлгээ', 'Тухай'];

  const coverImages = entity.coverImages || [entity.coverImage];

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto h-14 flex items-center px-4 gap-3">
          <Link href="/feed" className="flex items-center gap-2 no-underline shrink-0">
            <EsellerLogo size={22} />
            <span className="text-base font-black text-white hidden sm:block">eseller<span className="text-[#E31E24]">.mn</span></span>
          </Link>
          <div className="flex-1" />
          <Link href="/feed" className="text-xs font-semibold text-[var(--esl-text-muted)] no-underline hover:text-white transition">Зарын булан</Link>
          <Link href="/shops" className="text-xs font-semibold text-[var(--esl-text-muted)] no-underline hover:text-white transition">Дэлгүүрүүд</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroCarousel images={coverImages} label={entity.name}>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-end sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-3 border-white/20 shadow-2xl shrink-0 bg-[var(--esl-bg-card-hover)]">
              {entity.logo ? (
                <SafeImage src={entity.logo} alt={entity.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-[#E8242C] to-[#FF6B6B]">
                  {entity.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">{entity.name}</h1>
                {entity.isVerified && <Shield className="w-5 h-5 text-blue-400 fill-blue-400" />}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold bg-white/15 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                  {ENTITY_LABELS[entity.type]?.emoji} {ENTITY_LABELS[entity.type]?.label}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-white">{entity.rating}</span>
                  <span className="text-xs text-white/60">({entity.reviewCount})</span>
                </div>
                {entity.district && (
                  <span className="text-xs text-white/70 flex items-center gap-1"><MapPin className="w-3 h-3" /> {entity.district}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </HeroCarousel>

      {/* ── Action bar ── */}
      <div className="sticky top-14 z-40 bg-[var(--esl-bg-page)]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowPhone(!showPhone)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E8242C] text-white rounded-xl text-sm font-bold hover:bg-[#CC0000] transition cursor-pointer border-none"
          >
            <Phone className="w-4 h-4" />
            {showPhone ? entity.phone : 'Залгах'}
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/15 transition cursor-pointer border border-[var(--esl-border)]">
            <MessageCircle className="w-4 h-4" /> Мессеж
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/10 border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] hover:text-[#E8242C] transition cursor-pointer">
            <Heart className="w-4 h-4" />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/10 border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] hover:text-white transition cursor-pointer">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          {entity.website && (
            <a href={`https://${entity.website}`} target="_blank" rel="noopener" className="text-xs text-[var(--esl-text-muted)] hover:text-white transition no-underline flex items-center gap-1">
              <Globe className="w-3 h-3" /> {entity.website}
            </a>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {entity.stats.map((s, i) => <StatCard key={i} label={s.label} value={s.value} />)}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex gap-1 bg-[var(--esl-bg-elevated)] rounded-xl p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all',
                activeTab === i ? 'bg-[#E8242C] text-white' : 'bg-transparent text-[var(--esl-text-muted)] hover:text-[var(--esl-text-primary)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="max-w-6xl mx-auto px-4 pb-24">

        {/* === AUTO DEALER: Vehicles === */}
        {entityType === 'auto_dealer' && activeTab === 0 && entity.vehicles && (
          <div>
            {/* Brands */}
            {entity.brands && (
              <div className="flex gap-3 mb-6 flex-wrap">
                {entity.brands.map(b => (
                  <span key={b} className="text-xs font-bold text-[var(--esl-text-muted)] bg-white/5 border border-[var(--esl-border)] px-4 py-2 rounded-xl">{b}</span>
                ))}
              </div>
            )}
            {/* Scrollable vehicle cards */}
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {entity.vehicles.map(v => <VehicleCard key={v.id} v={v} />)}
            </div>
            <p className="text-xs text-[var(--esl-text-secondary)] mt-2 text-center">← Гулсуулж бүх машиныг харна уу →</p>

            {/* Vehicle Detail Modal */}
            {selectedVehicle && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedVehicle(null)}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedVehicle(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer border-none">
                    <X className="w-4 h-4" />
                  </button>
                  <SafeImage src={selectedVehicle.image} alt={selectedVehicle.title} className="w-full h-64 object-cover" />
                  <div className="p-6">
                    <h2 className="text-xl font-black text-[var(--esl-text-primary)] mb-2">{selectedVehicle.title}</h2>
                    <p className="text-2xl font-black text-[#E8242C] mb-4">{formatPrice(selectedVehicle.price)}₮</p>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-[var(--esl-bg-elevated)] rounded-xl p-3 text-center">
                        <Calendar className="w-4 h-4 text-[var(--esl-text-muted)] mx-auto mb-1" />
                        <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedVehicle.year}</p>
                        <p className="text-[10px] text-[var(--esl-text-secondary)]">Он</p>
                      </div>
                      <div className="bg-[var(--esl-bg-elevated)] rounded-xl p-3 text-center">
                        <Gauge className="w-4 h-4 text-[var(--esl-text-muted)] mx-auto mb-1" />
                        <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedVehicle.mileage.toLocaleString()} км</p>
                        <p className="text-[10px] text-[var(--esl-text-secondary)]">Гүйлт</p>
                      </div>
                      <div className="bg-[var(--esl-bg-elevated)] rounded-xl p-3 text-center">
                        <Fuel className="w-4 h-4 text-[var(--esl-text-muted)] mx-auto mb-1" />
                        <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedVehicle.fuel}</p>
                        <p className="text-[10px] text-[var(--esl-text-secondary)]">Түлш</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowPhone(true); setSelectedVehicle(null); }} className="flex-1 h-12 bg-[#E8242C] text-white font-bold rounded-xl border-none cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[#CC0000] transition">
                        <Phone className="w-4 h-4" /> Залгах
                      </button>
                      <button className="flex-1 h-12 bg-[var(--esl-bg-elevated)] text-[var(--esl-text-primary)] font-bold rounded-xl border border-[var(--esl-border)] cursor-pointer text-sm flex items-center justify-center gap-2 hover:opacity-80 transition">
                        <MessageCircle className="w-4 h-4" /> Мессеж
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listing Detail Modal */}
            {selectedListing && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedListing(null)}>
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedListing(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer border-none">
                    <X className="w-4 h-4" />
                  </button>
                  <SafeImage src={selectedListing.image} alt={selectedListing.title} className="w-full h-64 object-cover" />
                  <div className="p-5">
                    <h2 className="text-xl font-black text-[var(--esl-text-primary)] mb-2">{selectedListing.title}</h2>
                    <p className="text-2xl font-black text-[#E8242C] mb-4">{formatPrice(selectedListing.price)}₮</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-[var(--esl-bg-section)] rounded-lg">
                        <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedListing.sqm}м²</p>
                        <p className="text-[10px] text-[var(--esl-text-secondary)]">Талбай</p>
                      </div>
                      {selectedListing.rooms > 0 && (
                        <div className="text-center p-2 bg-[var(--esl-bg-section)] rounded-lg">
                          <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedListing.rooms}</p>
                          <p className="text-[10px] text-[var(--esl-text-secondary)]">Өрөө</p>
                        </div>
                      )}
                      <div className="text-center p-2 bg-[var(--esl-bg-section)] rounded-lg">
                        <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedListing.district}</p>
                        <p className="text-[10px] text-[var(--esl-text-secondary)]">Дүүрэг</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowPhone(true); setSelectedListing(null); }} className="flex-1 h-12 bg-[#E8242C] text-white font-bold rounded-xl border-none cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[#CC0000] transition">
                        <Phone className="w-4 h-4" /> Залгах
                      </button>
                      <button className="flex-1 h-12 bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] font-bold rounded-xl border border-[var(--esl-border)] cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[var(--esl-bg-card-hover)] transition">
                        <MessageCircle className="w-4 h-4" /> Мессеж
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === COMPANY: Projects === */}
        {entityType === 'company' && activeTab === 0 && entity.projects && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {entity.projects.map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}

        {/* === AGENT: Listings === */}
        {entityType === 'agent' && activeTab === 0 && entity.listings && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entity.listings.map(l => <ListingCard key={l.id} l={l} />)}
          </div>
        )}

        {/* === Gallery (auto_dealer tab 1, company tab 1) === */}
        {((entityType === 'auto_dealer' && activeTab === 1) || (entityType === 'company' && activeTab === 1)) && entity.gallery && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {entity.gallery.map((img, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer">
                <SafeImage src={img} alt={`${entity.name} gallery ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            ))}
          </div>
        )}

        {/* === Reviews === */}
        {((entityType === 'auto_dealer' && activeTab === 2) || (entityType === 'company' && activeTab === 2) || (entityType === 'agent' && activeTab === 1)) && (
          <div>
            {/* Rating summary */}
            <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-6 mb-6 flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-5xl font-black text-white">{entity.rating}</p>
                <div className="flex gap-0.5 justify-center my-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < Math.round(entity.rating) ? 'text-amber-400 fill-amber-400' : 'text-[#333]')} />
                  ))}
                </div>
                <p className="text-xs text-[var(--esl-text-muted)]">{entity.reviewCount} үнэлгээ</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(n => {
                  const count = entity.testimonials?.filter(t => t.rating === n).length || 0;
                  const pct = entity.testimonials?.length ? (count / entity.testimonials.length) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--esl-text-muted)] w-4">{n}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-[var(--esl-text-secondary)] w-4">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Testimonials */}
            {entity.testimonials && (
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none' }}>
                {entity.testimonials.map((t, i) => <TestimonialCard key={i} t={t} />)}
              </div>
            )}
          </div>
        )}

        {/* === About === */}
        {((entityType === 'auto_dealer' && activeTab === 3) || (entityType === 'company' && activeTab === 3) || (entityType === 'agent' && activeTab === 2)) && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-6">
              <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{entity.description}</p>
            </div>

            {/* Agent specific */}
            {entity.experience && (
              <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-3">Мэдээлэл</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><Clock className="w-4 h-4 text-[#E8242C]" /> {entity.experience} жилийн туршлага</div>
                  {entity.specialties?.map(s => (
                    <div key={s} className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><CheckCircle2 className="w-4 h-4 text-green-400" /> {s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {entity.milestones && (
              <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Түүх</h3>
                <div className="space-y-4 relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />
                  {entity.milestones.map((m, i) => (
                    <div key={i} className="flex gap-4 items-start relative">
                      <div className="w-4 h-4 rounded-full bg-[#E8242C] border-2 border-[var(--esl-bg-page)] shrink-0 z-10" />
                      <div>
                        <p className="text-xs font-bold text-[#E8242C]">{m.year}</p>
                        <p className="text-sm text-[var(--esl-text-muted)]">{m.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {entity.awards && (
              <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-3">Шагнал & Гэрчилгээ</h3>
                <div className="space-y-2">
                  {entity.awards.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]">
                      <Award className="w-4 h-4 text-amber-400" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="bg-white/5 border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-3">Холбоо барих</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><Phone className="w-4 h-4 text-[var(--esl-text-muted)]" /> {entity.phone}</div>
                {entity.email && <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><Mail className="w-4 h-4 text-[var(--esl-text-muted)]" /> {entity.email}</div>}
                {entity.website && <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><Globe className="w-4 h-4 text-[var(--esl-text-muted)]" /> {entity.website}</div>}
                {entity.district && <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><MapPin className="w-4 h-4 text-[var(--esl-text-muted)]" /> {entity.district} дүүрэг</div>}
                {entity.social?.ig && <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><Camera className="w-4 h-4 text-[var(--esl-text-muted)]" /> {entity.social.ig}</div>}
                {entity.social?.fb && <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)]"><BookOpen className="w-4 h-4 text-[var(--esl-text-muted)]" /> {entity.social.fb}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer border-none">
              <X className="w-4 h-4" />
            </button>
            <SafeImage src={selectedProject.image} alt={selectedProject.title} className="w-full h-64 object-cover" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/10 text-[var(--esl-text-secondary)]">
                  {selectedProject.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-[var(--esl-text-primary)] mb-2">{selectedProject.title}</h2>
              <p className="text-sm text-[var(--esl-text-muted)] flex items-center gap-1 mb-4">
                <MapPin className="w-4 h-4" /> {selectedProject.location}
              </p>
              <div className="mb-5">
                <div className="flex justify-between text-xs text-[var(--esl-text-secondary)] mb-1">
                  <span>Ахиц</span>
                  <span className="font-bold text-[var(--esl-text-primary)]">{selectedProject.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#E8242C] to-[#FF6B6B] rounded-full" style={{ width: `${selectedProject.progress}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-[var(--esl-bg-elevated)] rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedProject.units}</p>
                  <p className="text-[10px] text-[var(--esl-text-secondary)]">айл</p>
                </div>
                <div className="bg-[var(--esl-bg-elevated)] rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-[#E8242C]">{formatPrice(selectedProject.priceFrom)}₮~</p>
                  <p className="text-[10px] text-[var(--esl-text-secondary)]">эхлэх үнэ</p>
                </div>
                <div className="bg-[var(--esl-bg-elevated)] rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedProject.year}</p>
                  <p className="text-[10px] text-[var(--esl-text-secondary)]">он</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPhone(true); setSelectedProject(null); }} className="flex-1 h-12 bg-[#E8242C] text-white font-bold rounded-xl border-none cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[#CC0000] transition">
                  <Phone className="w-4 h-4" /> Залгах
                </button>
                <button onClick={() => setSelectedProject(null)} className="flex-1 h-12 bg-[var(--esl-bg-elevated)] text-[var(--esl-text-primary)] font-bold rounded-xl border border-[var(--esl-border)] cursor-pointer text-sm flex items-center justify-center gap-2 hover:opacity-80 transition">
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedListing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedListing(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer border-none">
              <X className="w-4 h-4" />
            </button>
            <SafeImage src={selectedListing.image} alt={selectedListing.title} className="w-full h-64 object-cover" />
            <div className="p-5">
              <h2 className="text-xl font-black text-[var(--esl-text-primary)] mb-2">{selectedListing.title}</h2>
              <p className="text-2xl font-black text-[#E8242C] mb-4">{formatPrice(selectedListing.price)}₮</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-[var(--esl-bg-section)] rounded-lg">
                  <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedListing.sqm}м²</p>
                  <p className="text-[10px] text-[var(--esl-text-secondary)]">Талбай</p>
                </div>
                {selectedListing.rooms > 0 && (
                  <div className="text-center p-2 bg-[var(--esl-bg-section)] rounded-lg">
                    <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedListing.rooms}</p>
                    <p className="text-[10px] text-[var(--esl-text-secondary)]">Өрөө</p>
                  </div>
                )}
                <div className="text-center p-2 bg-[var(--esl-bg-section)] rounded-lg">
                  <p className="text-sm font-bold text-[var(--esl-text-primary)]">{selectedListing.district}</p>
                  <p className="text-[10px] text-[var(--esl-text-secondary)]">Дүүрэг</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowPhone(true); setSelectedListing(null); }} className="flex-1 h-12 bg-[#E8242C] text-white font-bold rounded-xl border-none cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[#CC0000] transition">
                  <Phone className="w-4 h-4" /> Залгах
                </button>
                <button className="flex-1 h-12 bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] font-bold rounded-xl border border-[var(--esl-border)] cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[var(--esl-bg-card-hover)] transition">
                  <MessageCircle className="w-4 h-4" /> Мессеж
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
