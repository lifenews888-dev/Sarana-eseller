'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Car, Home, Loader2, MapPin, Send, Tag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MediaUploader } from '@/components/shared/MediaUploader';
import { ENTITY_CARD_CONFIG, type EntityType as CardEntityType } from '@/lib/cards/entityCardConfig';
import { PRODUCT_MARKETPLACE_CATEGORIES, SERVICE_MARKETPLACE_CATEGORIES } from '@/lib/marketplaceCategories';

type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'list';
type MetadataValue = string | number | boolean | string[];

type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  ph?: string;
  options?: string[];
  hint?: string;
};

type EntityFieldConfig = {
  label: string;
  mediaType: CardEntityType;
  icon: typeof Tag;
  fields: FieldDef[];
};

type FeedMedia = { type: string; url: string };
type FeedListItem = {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  images?: string[];
  category?: string | null;
  entityType?: string | null;
  district?: string | null;
  tier?: string | null;
  metadata?: Record<string, unknown> | null;
  media?: FeedMedia[];
};

type FeedBuckets = {
  vip?: FeedListItem[];
  featured?: FeedListItem[];
  discounted?: FeedListItem[];
  normal?: FeedListItem[];
};

const REAL_ESTATE_FIELDS: FieldDef[] = [
  { key: 'propertyType', label: 'Төрөл', type: 'select', options: ['Орон сууц', 'Оффис', 'Газар', 'Хаус', 'Пентхаус'], ph: 'Орон сууц' },
  { key: 'listingType', label: 'Зарын төрөл', type: 'select', options: ['Худалдах', 'Түрээс', 'Захиалга'], ph: 'Худалдах' },
  { key: 'buildingName', label: 'Хотхон / байр', type: 'text', ph: 'River Garden' },
  { key: 'address', label: 'Байршлын дэлгэрэнгүй', type: 'text', ph: 'СБД, Туул голын эрэг' },
  { key: 'microDistrict', label: 'Хороолол', type: 'text', ph: 'River Garden хотхон' },
  { key: 'landmark', label: 'Ойролцоо тэмдэглэгээ', type: 'text', ph: 'Clubhouse ойролцоо' },
  { key: 'sqm', label: 'Талбай (м²)', type: 'number', ph: '98' },
  { key: 'rooms', label: 'Өрөөний тоо', type: 'number', ph: '3' },
  { key: 'bedrooms', label: 'Унтлагын өрөө', type: 'number', ph: '2' },
  { key: 'bathrooms', label: 'Ариун цэврийн өрөө', type: 'number', ph: '2' },
  { key: 'floor', label: 'Давхар', type: 'number', ph: '12' },
  { key: 'totalFloors', label: 'Нийт давхар', type: 'number', ph: '24' },
  { key: 'builtYear', label: 'Барилгын он', type: 'number', ph: '2021' },
  { key: 'buildingType', label: 'Барилгын хийц', type: 'text', ph: 'Бүрэн цутгамал' },
  { key: 'condition', label: 'Засвар', type: 'text', ph: 'Шинэ засвар' },
  { key: 'furnishing', label: 'Тавилга', type: 'text', ph: 'Хагас тавилгатай' },
  { key: 'orientation', label: 'Цонхны харц', type: 'text', ph: 'Урагшаа, баруун' },
  { key: 'balcony', label: 'Тагт', type: 'text', ph: '2 тагт' },
  { key: 'windowCount', label: 'Цонхны тоо', type: 'number', ph: '5' },
  { key: 'heating', label: 'Халаалт', type: 'text', ph: 'Төвийн халаалт' },
  { key: 'parking', label: 'Зогсоол', type: 'text', ph: 'Дулаан зогсоол тусдаа тохиролцоно' },
  { key: 'garage', label: 'Гараж', type: 'text', ph: 'Байгаа' },
  { key: 'ownershipType', label: 'Өмчлөлийн хэлбэр', type: 'text', ph: 'Хувийн өмч' },
  { key: 'certificateReady', label: 'Үл хөдлөхийн гэрчилгээ', type: 'boolean' },
  { key: 'mortgageAvailable', label: 'Ипотекийн боломж', type: 'boolean' },
  { key: 'maintenanceFeeMnt', label: 'СӨХ төлбөр', type: 'number', ph: '220000' },
  { key: 'moveInDate', label: 'Нүүж орох боломж', type: 'text', ph: 'Шууд нүүж орно' },
  { key: 'highlights', label: 'Давуу тал', type: 'list', ph: 'Голын эрэгтэй ойр, Хаалттай хотхон, 24/7 хамгаалалт' },
  { key: 'nearby', label: 'Ойр орчим', type: 'list', ph: 'Сургууль 5 минут, Цэцэрлэг 3 минут, Автобусны буудал' },
  { key: 'documents', label: 'Баримт бичиг', type: 'list', ph: 'Үл хөдлөхийн гэрчилгээ, Кадастрын зураг' },
];

const CONSTRUCTION_FIELDS: FieldDef[] = [
  { key: 'projectStatus', label: 'Төслийн төлөв', type: 'select', options: ['Төлөвлөж байна', 'Барьж байна', 'Борлуулж байна', 'Ашиглалтад орсон'] },
  { key: 'address', label: 'Байршил', type: 'text', ph: 'ХУД, Зайсан' },
  { key: 'totalUnits', label: 'Нийт айл', type: 'number', ph: '240' },
  { key: 'soldUnits', label: 'Борлуулагдсан айл', type: 'number', ph: '96' },
  { key: 'availableUnits', label: 'Боломжит үлдэгдэл', type: 'number', ph: '144' },
  { key: 'pricePerSqm', label: 'Үнэ / м²', type: 'number', ph: '3200000' },
  { key: 'completionDate', label: 'Ашиглалтад орох', type: 'text', ph: '2027 он' },
  { key: 'floors', label: 'Давхар', type: 'number', ph: '24' },
  { key: 'parking', label: 'Зогсоол', type: 'text', ph: 'Дулаан зогсоол' },
  { key: 'roomChoices', label: 'Өрөөний сонголт', type: 'list', ph: '2 өрөө 58м², 3 өрөө 92м², 4 өрөө 128м²' },
  { key: 'amenities', label: 'Давуу тал', type: 'list', ph: 'Хүүхдийн талбай, Фитнес, Хаалттай хотхон' },
  { key: 'paymentTerms', label: 'Төлбөрийн нөхцөл', type: 'list', ph: 'Урьдчилгаа 30%, Банкны зээл, Хувааж төлөх' },
];

const AUTO_FIELDS: FieldDef[] = [
  { key: 'brand', label: 'Брэнд', type: 'text', ph: 'Toyota' },
  { key: 'model', label: 'Модель', type: 'text', ph: 'Land Cruiser 300' },
  { key: 'year', label: 'Он', type: 'number', ph: '2024' },
  { key: 'mileage', label: 'Гүйлт (км)', type: 'number', ph: '45000' },
  { key: 'engine', label: 'Хөдөлгүүр', type: 'text', ph: '3.3 Twin Turbo' },
  { key: 'fuelType', label: 'Түлш', type: 'select', options: ['Бензин', 'Дизель', 'Hybrid', 'Цахилгаан', 'Gas'] },
  { key: 'transmission', label: 'Кроп', type: 'select', options: ['Автомат', 'Механик'] },
  { key: 'drivetrain', label: 'Хөтлөгч', type: 'select', options: ['FWD', 'RWD', 'AWD', '4WD'] },
  { key: 'color', label: 'Өнгө', type: 'text', ph: 'Хар' },
  { key: 'importedFrom', label: 'Орж ирсэн улс', type: 'text', ph: 'Япон' },
  { key: 'condition', label: 'Нөхцөл', type: 'text', ph: 'Маш сайн' },
  { key: 'registrationStatus', label: 'Бүртгэл', type: 'text', ph: 'Монгол дугаартай' },
  { key: 'inspectionValidUntil', label: 'Үзлэг хүчинтэй', type: 'text', ph: '2027-04' },
  { key: 'ownersCount', label: 'Эзэмшигчийн тоо', type: 'number', ph: '1' },
  { key: 'vinLast4', label: 'VIN сүүлийн 4', type: 'text', ph: '8F21' },
  { key: 'warranty', label: 'Баталгаа', type: 'text', ph: '12 сар' },
  { key: 'features', label: 'Тоноглол', type: 'list', ph: '360 камер, Суудал халаалт, Adaptive cruise' },
  { key: 'documents', label: 'Бичиг баримт', type: 'list', ph: 'Гаалийн бичиг, Оношилгоо, Үйлдвэрийн баталгаа' },
];

const ENTITY_FIELDS: Record<string, EntityFieldConfig> = {
  store: { label: 'Дэлгүүрийн зар', mediaType: 'STORE', icon: Tag, fields: [] },
  pre_order: {
    label: 'Захиалгын бараа',
    mediaType: 'PRE_ORDER',
    icon: Tag,
    fields: [
      { key: 'minBatch', label: 'Минимум захиалга', type: 'number', ph: '10' },
      { key: 'currentBatch', label: 'Одоогийн захиалга', type: 'number', ph: '4' },
      { key: 'advancePercent', label: 'Урьдчилгаа %', type: 'number', ph: '30' },
      { key: 'deliveryEstimate', label: 'Хүргэлтийн хугацаа', type: 'text', ph: '14 хоног' },
    ],
  },
  agent: { label: 'Үл хөдлөхийн зар', mediaType: 'REAL_ESTATE', icon: Home, fields: REAL_ESTATE_FIELDS },
  company: { label: 'Барилгын төсөл', mediaType: 'CONSTRUCTION', icon: Building2, fields: CONSTRUCTION_FIELDS },
  auto_dealer: { label: 'Авто зар', mediaType: 'AUTO', icon: Car, fields: AUTO_FIELDS },
  service: {
    label: 'Үйлчилгээний зар',
    mediaType: 'SERVICE',
    icon: Tag,
    fields: [
      { key: 'duration', label: 'Үргэлжлэх хугацаа', type: 'text', ph: '60 минут' },
      { key: 'availableSlots', label: 'Сул цаг', type: 'number', ph: '8' },
      { key: 'address', label: 'Байршил', type: 'text', ph: 'СБД, 1-р хороо' },
      { key: 'packageName', label: 'Багц', type: 'text', ph: 'Стандарт үйлчилгээ' },
    ],
  },
  digital: {
    label: 'Дижитал бараа',
    mediaType: 'DIGITAL',
    icon: Tag,
    fields: [
      { key: 'fileType', label: 'Файлын төрөл', type: 'text', ph: 'PDF / ZIP / Video' },
      { key: 'fileSize', label: 'Файлын хэмжээ', type: 'text', ph: '24MB' },
    ],
  },
};

const DISTRICTS = ['СБД', 'ХУД', 'БЗД', 'ЧД', 'БГД', 'СХД', 'НД', 'БНД', 'Багахангай', 'Налайх'];
const VALID_ENTITY_TYPES = new Set(Object.keys(ENTITY_FIELDS));
const SPECIAL_ENTITY_TYPES = new Set(['agent', 'company', 'auto_dealer']);

const SPECIAL_LISTING_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  agent: [
    { value: 'apartment', label: 'Орон сууц' },
    { value: 'house', label: 'Хаус' },
    { value: 'office', label: 'Оффис' },
    { value: 'land', label: 'Газар' },
    { value: 'penthouse', label: 'Пентхаус' },
  ],
  company: [
    { value: 'new_building', label: 'Шинэ орон сууц' },
    { value: 'residential_project', label: 'Орон сууцны төсөл' },
    { value: 'commercial_project', label: 'Оффис / худалдааны төсөл' },
    { value: 'mixed_use_project', label: 'Холимог зориулалттай төсөл' },
  ],
  auto_dealer: [
    { value: 'vehicle', label: 'Автомашин' },
    { value: 'sedan', label: 'Седан' },
    { value: 'suv', label: 'SUV / Жийп' },
    { value: 'truck', label: 'Ачааны машин' },
    { value: 'motorcycle', label: 'Мотоцикл' },
    { value: 'auto_part', label: 'Авто сэлбэг' },
  ],
};

function listingCategoryOptions(entityType: string): { value: string; label: string }[] {
  if (SPECIAL_LISTING_CATEGORIES[entityType]) return SPECIAL_LISTING_CATEGORIES[entityType];
  if (entityType === 'service') {
    return SERVICE_MARKETPLACE_CATEGORIES.map((category) => ({ value: category.key, label: category.label }));
  }
  return PRODUCT_MARKETPLACE_CATEGORIES.map((category) => ({ value: category.key, label: category.label }));
}

function normalizeEntityType(value?: string | null): string {
  if (!value) return 'store';
  if (value === 'real_estate') return 'agent';
  if (value === 'construction') return 'company';
  if (value === 'order_store') return 'store';
  return VALID_ENTITY_TYPES.has(value) ? value : 'store';
}

function redirectFor(entityType: string): string {
  if (entityType === 'auto_dealer') return '/dashboard/store/vehicles';
  if (entityType === 'company') return '/dashboard/store/projects';
  return '/dashboard/store/listings';
}

function defaultCategory(entityType: string, metadata: Record<string, MetadataValue>): string {
  if (entityType === 'company') return 'new_building';
  if (entityType === 'auto_dealer') return 'vehicle';
  if (entityType === 'service') return 'service';
  if (entityType !== 'agent') return '';

  const type = String(metadata.propertyType || '').toLowerCase();
  if (type.includes('газар')) return 'land';
  if (type.includes('оффис')) return 'office';
  if (type.includes('хаус')) return 'house';
  return 'apartment';
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string): number | null {
  const n = Number(value.replace(/[,\s₮]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function flattenFeed(data: (FeedBuckets & { data?: FeedBuckets }) | null): FeedListItem[] {
  const d = data?.data || data || {};
  return [
    ...(d.vip || []),
    ...(d.featured || []),
    ...(d.discounted || []),
    ...(d.normal || []),
  ];
}

function metadataToForm(value?: Record<string, unknown> | null): Record<string, string> {
  if (!value) return {};
  const form: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (Array.isArray(raw)) form[key] = raw.map(String).join(', ');
    else if (typeof raw === 'boolean') form[key] = raw ? 'true' : 'false';
    else if (raw !== null && raw !== undefined) form[key] = String(raw);
  }
  return form;
}

function normalizeMetadata(
  fields: FieldDef[],
  values: Record<string, string>,
  entityType: string,
  district: string,
  price?: number,
): Record<string, MetadataValue> {
  const clean: Record<string, MetadataValue> = {};

  for (const field of fields) {
    const raw = values[field.key]?.trim();
    if (!raw) continue;

    if (field.type === 'number') {
      const n = parseNumber(raw);
      if (n !== null) clean[field.key] = n;
    } else if (field.type === 'boolean') {
      clean[field.key] = raw === 'true';
    } else if (field.type === 'list') {
      const list = splitList(raw);
      if (list.length > 0) clean[field.key] = list;
    } else {
      clean[field.key] = raw;
    }
  }

  if (district && !clean.district) clean.district = district;
  if (clean.sqm && !clean.area) clean.area = clean.sqm;

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

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [queryEntityType] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('entityType')
  );
  const [editId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('edit')
  );
  const [editEntityType, setEditEntityType] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    district: '',
    tier: 'normal',
  });
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(editId));
  const [error, setError] = useState('');

  const entityType = normalizeEntityType(editEntityType || queryEntityType || user?.entityType);
  const config = ENTITY_FIELDS[entityType] || ENTITY_FIELDS.store;
  const mediaConfig = ENTITY_CARD_CONFIG[config.mediaType];
  const maxImages = mediaConfig.maxImages;
  const isSpecialListing = SPECIAL_ENTITY_TYPES.has(entityType);
  const SectionIcon = config.icon;
  const categoryOptions = listingCategoryOptions(entityType);

  const titlePlaceholder =
    entityType === 'auto_dealer'
      ? 'Toyota Land Cruiser 300, 2024'
      : entityType === 'company'
        ? 'Zaisan Heights шинэ төсөл'
        : entityType === 'agent'
          ? '3 өрөө байр, Ривер Гарден'
          : 'Зарын гарчиг';

  useEffect(() => {
    if (!editId) return;

    const token = localStorage.getItem('token');
    const controller = new AbortController();
    fetch('/api/feed?mine=1&limit=100', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((payload) => {
        const item = flattenFeed(payload).find((entry) => entry.id === editId);
        if (!item) {
          setError('Засах зар олдсонгүй эсвэл эрх хүрэхгүй байна');
          return;
        }

        setEditEntityType(item.entityType || null);
        setForm({
          title: item.title || '',
          description: item.description || '',
          price: item.price ? String(item.price) : '',
          originalPrice: item.originalPrice ? String(item.originalPrice) : '',
          category: item.category || '',
          district: item.district || '',
          tier: item.tier || 'normal',
        });
        setImages(item.images || []);
        setMetadata(metadataToForm(item.metadata));
        setVideoUrl(item.media?.find((media) => media.type === 'VIDEO')?.url || '');
        setVirtualTourUrl(item.media?.find((media) => media.type === 'VIRTUAL_TOUR')?.url || '');
        setFloorPlanUrl(item.media?.find((media) => media.type === 'FLOOR_PLAN')?.url || '');
      })
      .catch((err) => {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setError('Зарын мэдээлэл татахад алдаа гарлаа');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setPrefillLoading(false);
      });

    return () => controller.abort();
  }, [editId]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateMeta = (key: string, value: string) => setMetadata((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Гарчиг оруулна уу');
      return;
    }
    if (isSpecialListing && form.description.trim().length < 30) {
      setError('Онцгой зар дээр худалдан авагч ойлгохуйц дэлгэрэнгүй тайлбар оруулна уу');
      return;
    }
    if (isSpecialListing && images.length < 3) {
      setError('Машин, байр, төсөл зэрэг тусгай зар дээр хамгийн багадаа 3 зураг оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    const price = form.price ? Number(form.price) : undefined;
    const cleanMetadata = normalizeMetadata(config.fields, metadata, entityType, form.district, price);
    const category = form.category.trim() || defaultCategory(entityType, cleanMetadata);
    const token = localStorage.getItem('token');

    const res = await fetch(editId ? `/api/feed/${editId}` : '/api/feed', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        ...form,
        category,
        price,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        images,
        videoUrl,
        virtualTourUrl,
        floorPlanUrl,
        entityType,
        metadata: cleanMetadata,
      }),
    });

    if (res.ok) {
      router.push(redirectFor(entityType));
    } else {
      const payload = await res.json().catch(() => null);
      setError(payload?.error || payload?.data?.error || 'Алдаа гарлаа');
    }
    setLoading(false);
  };

  const inputCls = 'w-full px-3 py-2.5 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)] outline-none focus:border-[#E8242C]';
  const labelCls = 'text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={redirectFor(entityType)} className="w-8 h-8 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] no-underline hover:bg-[var(--esl-bg-card)]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--esl-text-primary)]">{editId ? 'Зар засах' : 'Зар нэмэх'}</h1>
          <p className="text-xs text-[var(--esl-text-secondary)]">{config.label}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {prefillLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-4 py-3 text-sm text-[var(--esl-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Засах зарын мэдээлэл татаж байна...
        </div>
      )}

      <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
        <h3 className="font-bold text-[var(--esl-text-primary)] flex items-center gap-2">
          <Tag className="w-4 h-4" /> Үндсэн мэдээлэл
        </h3>
        <div>
          <label className={labelCls}>Гарчиг *</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder={titlePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Тайлбар {isSpecialListing ? '*' : ''}</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} placeholder="Дэлгэрэнгүй тайлбар..." className={`${inputCls} resize-y`} />
          {isSpecialListing ? <p className="mt-1 text-[11px] text-[var(--esl-text-muted)]">Худалдан авагч шийдвэр гаргах хэмжээний бодит мэдээлэл оруулна.</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Үнэ (₮)</label>
            <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="450000000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Хуучин үнэ (₮)</label>
            <input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} placeholder="Хямдралгүй бол хоосон" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Онцлох байрлал</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['normal', 'Стандарт'],
              ['featured', 'Онцлох'],
              ['vip', 'VIP'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update('tier', value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${form.tier === value ? 'border-[#E8242C] bg-[#E8242C] text-white' : 'border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
        <MediaUploader
          context="product"
          value={images}
          onChange={setImages}
          maxFiles={maxImages}
          label={`Зурагнууд (${images.length}/${maxImages})${isSpecialListing ? ' · хамгийн багадаа 3' : ''}`}
          entityType={config.mediaType}
          videoUrl={videoUrl}
          onVideoChange={setVideoUrl}
          virtualTourUrl={virtualTourUrl}
          onVirtualTourChange={setVirtualTourUrl}
          floorPlanUrl={floorPlanUrl}
          onFloorPlanChange={setFloorPlanUrl}
        />
      </div>

      <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
        <h3 className="font-bold text-[var(--esl-text-primary)] flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Байршил ба ангилал
        </h3>
        <div>
          <label className={labelCls}>Дүүрэг</label>
          <select value={form.district} onChange={(e) => update('district', e.target.value)} className={inputCls}>
            <option value="">Сонгох...</option>
            {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ангилал</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className={inputCls}>
            <option value="">Төрлөөс автоматаар оноох</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[var(--esl-text-muted)]">
            Дэлгүүр, үйлчилгээ, авто, үл хөдлөх болон төслийн зарууд тус бүр өөрийн ангиллын сонголттой.
          </p>
        </div>
      </div>

      {config.fields.length > 0 && (
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
          <h3 className="font-bold text-[var(--esl-text-primary)] flex items-center gap-2">
            <SectionIcon className="w-4 h-4" /> {config.label} мэдээлэл
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={metadata[field.key] || ''}
                onChange={(value) => updateMeta(field.key, value)}
                inputCls={inputCls}
                labelCls={labelCls}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || prefillLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#E8242C] text-white rounded-xl font-bold text-sm border-none cursor-pointer hover:bg-red-700 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Илгээж байна...' : editId ? 'Зар хадгалах' : 'Зар нэмэх'}
      </button>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  inputCls,
  labelCls,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  inputCls: string;
  labelCls: string;
}) {
  return (
    <div className={field.type === 'textarea' || field.type === 'list' ? 'sm:col-span-2' : undefined}>
      <label className={labelCls}>{field.label}</label>
      {field.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Сонгох...</option>
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : field.type === 'boolean' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Сонгох...</option>
          <option value="true">Тийм</option>
          <option value="false">Үгүй</option>
        </select>
      ) : field.type === 'textarea' || field.type === 'list' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={field.type === 'list' ? 3 : 4} placeholder={field.ph} className={`${inputCls} resize-y`} />
      ) : (
        <input type={field.type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.ph} className={inputCls} />
      )}
      {field.hint ? <p className="mt-1 text-[11px] text-[var(--esl-text-muted)]">{field.hint}</p> : null}
      {field.type === 'list' ? <p className="mt-1 text-[11px] text-[var(--esl-text-muted)]">Таслалаар эсвэл мөр мөрөөр тусгаарлаж оруулна.</p> : null}
    </div>
  );
}
