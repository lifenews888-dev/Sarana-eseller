import { normalizeMarketplaceCategory } from './marketplaceCategories';

export type ListingMetadataFieldType = 'text' | 'number' | 'select' | 'boolean' | 'list';
export type ListingMetadataValue = string | number | boolean | string[];

export type ListingMetadataField = {
  key: string;
  label: string;
  type: ListingMetadataFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
};

export type ListingMetadataRecord = Record<string, ListingMetadataValue>;
export type ListingMetadataDraft = Record<string, string>;

const VEHICLE_FIELDS: ListingMetadataField[] = [
  { key: 'brand', label: 'Үйлдвэрлэгч', type: 'text', required: true, placeholder: 'Toyota' },
  { key: 'model', label: 'Загвар', type: 'text', required: true, placeholder: 'Land Cruiser 300' },
  { key: 'year', label: 'Он', type: 'number', required: true, placeholder: '2024' },
  { key: 'mileage', label: 'Гүйлт, км', type: 'number', required: true, placeholder: '45000' },
  { key: 'engine', label: 'Хөдөлгүүр', type: 'text', placeholder: '3.5 бензин / 2.8 дизель' },
  { key: 'fuelType', label: 'Түлш', type: 'select', options: ['Бензин', 'Дизель', 'Хайбрид', 'Цахилгаан', 'Газ'] },
  { key: 'transmission', label: 'Кроп', type: 'select', options: ['Автомат', 'Механик', 'CVT'] },
  { key: 'drivetrain', label: 'Хөтлөгч', type: 'select', options: ['4WD', 'AWD', 'FWD', 'RWD'] },
  { key: 'color', label: 'Өнгө', type: 'text', placeholder: 'Цагаан' },
  { key: 'importedFrom', label: 'Орж ирсэн улс', type: 'text', placeholder: 'Япон' },
  { key: 'registrationStatus', label: 'Бүртгэл', type: 'select', options: ['Монголд бүртгэлтэй', 'Дугаар аваагүй', 'Импортын бичигтэй'] },
  { key: 'inspectionValidUntil', label: 'Үзлэг хүчинтэй', type: 'text', placeholder: '2026-12' },
  { key: 'ownersCount', label: 'Эзэмшигчийн тоо', type: 'number', placeholder: '1' },
  { key: 'vinLast4', label: 'VIN сүүлийн 4', type: 'text', placeholder: '1234' },
  { key: 'warranty', label: 'Баталгаа', type: 'text', placeholder: '3 сар / байхгүй' },
  { key: 'features', label: 'Тоноглол', type: 'list', placeholder: 'арьсан салон, 360 камер, суудал халаагч' },
  { key: 'documents', label: 'Бичиг баримт', type: 'list', placeholder: 'гаалийн бичиг, гэрчилгээ, татвар төлсөн' },
];

const REAL_ESTATE_FIELDS: ListingMetadataField[] = [
  { key: 'propertyType', label: 'Үл хөдлөхийн төрөл', type: 'select', required: true, options: ['Орон сууц', 'Хаус', 'Оффис', 'Газар', 'Агуулах', 'Зуслан'] },
  { key: 'listingType', label: 'Зарын төрөл', type: 'select', required: true, options: ['Худалдах', 'Түрээслэх', 'Бартер', 'Урьдчилсан захиалга'] },
  { key: 'buildingName', label: 'Хотхон / барилга', type: 'text', placeholder: 'River Garden' },
  { key: 'address', label: 'Байршлын дэлгэрэнгүй', type: 'text', placeholder: 'ХУД, 11-р хороо' },
  { key: 'microDistrict', label: 'Хороолол / ойр орчим', type: 'text', placeholder: 'Зайсан' },
  { key: 'sqm', label: 'Талбай, м²', type: 'number', required: true, placeholder: '98' },
  { key: 'rooms', label: 'Өрөө', type: 'number', required: true, placeholder: '3' },
  { key: 'bedrooms', label: 'Унтлагын өрөө', type: 'number', placeholder: '2' },
  { key: 'bathrooms', label: 'Ариун цэврийн өрөө', type: 'number', placeholder: '2' },
  { key: 'floor', label: 'Давхар', type: 'number', placeholder: '8' },
  { key: 'totalFloors', label: 'Нийт давхар', type: 'number', placeholder: '16' },
  { key: 'builtYear', label: 'Барилгын он', type: 'number', placeholder: '2023' },
  { key: 'buildingType', label: 'Барилгын хийц', type: 'select', options: ['Бүрэн цутгамал', 'Тоосгон', 'Угсармал', 'Карказ', 'Блок'] },
  { key: 'condition', label: 'Засвар', type: 'select', options: ['Шинэ засвар', 'Евро засвар', 'Энгийн', 'Засвар хэрэгтэй'] },
  { key: 'furnishing', label: 'Тавилгатай эсэх', type: 'select', options: ['Бүрэн тавилгатай', 'Хагас тавилгатай', 'Тавилгагүй'] },
  { key: 'orientation', label: 'Цонхны харц', type: 'text', placeholder: 'Урагш / уул руу' },
  { key: 'balcony', label: 'Тагт', type: 'select', options: ['Тагттай', 'Тагтгүй', '2+ тагттай'] },
  { key: 'heating', label: 'Халаалт', type: 'select', options: ['Төвийн', 'Цахилгаан', 'Нам даралт', 'Шалны халаалт'] },
  { key: 'parking', label: 'Зогсоол', type: 'text', placeholder: 'дулаан зогсоолтой' },
  { key: 'garage', label: 'Гараж', type: 'text', placeholder: 'байгаа / байхгүй' },
  { key: 'ownershipType', label: 'Өмчлөл', type: 'select', options: ['Хувийн өмч', 'Компанийн өмч', 'Эзэмших эрх'] },
  { key: 'certificateReady', label: 'Үл хөдлөхийн гэрчилгээ', type: 'boolean' },
  { key: 'mortgageAvailable', label: 'Ипотекийн боломж', type: 'boolean' },
  { key: 'maintenanceFeeMnt', label: 'СӨХ төлбөр, ₮', type: 'number', placeholder: '150000' },
  { key: 'moveInDate', label: 'Нүүх боломжтой огноо', type: 'text', placeholder: 'шууд / 2026-06-01' },
  { key: 'highlights', label: 'Давуу тал', type: 'list', placeholder: 'сургууль ойр, дулаан зогсоол, цэвэр агаар' },
  { key: 'nearby', label: 'Ойр орчим', type: 'list', placeholder: 'сургууль, цэцэрлэг, худалдааны төв' },
  { key: 'documents', label: 'Бичиг баримт', type: 'list', placeholder: 'гэрчилгээ, кадастр, банкны боломж' },
];

const NEW_BUILDING_FIELDS: ListingMetadataField[] = [
  { key: 'projectStatus', label: 'Төслийн төлөв', type: 'select', required: true, options: ['Борлуулж байна', 'Баригдаж байна', 'Ашиглалтад орсон', 'Төлөвлөж байна'] },
  { key: 'address', label: 'Байршил', type: 'text', required: true, placeholder: 'СБД, 1-р хороо' },
  { key: 'completionDate', label: 'Ашиглалтад орох', type: 'text', required: true, placeholder: '2027 он / 2027 Q4' },
  { key: 'totalUnits', label: 'Нийт айл', type: 'number', required: true, placeholder: '240' },
  { key: 'soldUnits', label: 'Борлуулагдсан айл', type: 'number', placeholder: '95' },
  { key: 'availableUnits', label: 'Боломжит үлдэгдэл', type: 'number', placeholder: '145' },
  { key: 'pricePerSqm', label: '1м² үнэ, ₮', type: 'number', required: true, placeholder: '7800000' },
  { key: 'floors', label: 'Давхар', type: 'number', placeholder: '16' },
  { key: 'parking', label: 'Зогсоол', type: 'text', placeholder: 'дулаан зогсоолтой' },
  { key: 'roomChoices', label: 'Өрөөний сонголт', type: 'list', placeholder: '2 өрөө, 3 өрөө, 4 өрөө' },
  { key: 'amenities', label: 'Давуу тал', type: 'list', placeholder: 'хүүхдийн талбай, фитнес, security' },
  { key: 'paymentTerms', label: 'Төлбөрийн нөхцөл', type: 'list', placeholder: 'банк, хувь лизинг, урьдчилгаа 30%' },
];

const PHONE_FIELDS: ListingMetadataField[] = [
  { key: 'brand', label: 'Брэнд', type: 'text', required: true, placeholder: 'Apple / Samsung' },
  { key: 'model', label: 'Загвар', type: 'text', required: true, placeholder: 'iPhone 15 Pro Max' },
  { key: 'storage', label: 'Багтаамж', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
  { key: 'color', label: 'Өнгө', type: 'text', placeholder: 'Black Titanium' },
  { key: 'batteryHealth', label: 'Battery health, %', type: 'number', placeholder: '92' },
  { key: 'simType', label: 'SIM', type: 'select', options: ['1 SIM', 'Dual SIM', 'eSIM', 'SIM + eSIM'] },
  { key: 'condition', label: 'Төлөв', type: 'select', options: ['Шинэ', 'Бараг шинэ', 'Хэрэглэсэн', 'Сэвтэй'] },
  { key: 'warranty', label: 'Баталгаа', type: 'text', placeholder: 'Apple warranty / дэлгүүрийн баталгаа' },
  { key: 'accessories', label: 'Дагалдах хэрэгсэл', type: 'list', placeholder: 'цэнэглэгч, хайрцаг, case' },
];

const TECHNOLOGY_FIELDS: ListingMetadataField[] = [
  { key: 'brand', label: 'Брэнд', type: 'text', placeholder: 'Apple / Dell / Sony' },
  { key: 'model', label: 'Загвар', type: 'text', placeholder: 'MacBook Pro M3' },
  { key: 'condition', label: 'Төлөв', type: 'select', options: ['Шинэ', 'Бараг шинэ', 'Хэрэглэсэн', 'Сэвтэй'] },
  { key: 'warranty', label: 'Баталгаа', type: 'text', placeholder: '6 сар' },
  { key: 'specs', label: 'Үзүүлэлт', type: 'list', placeholder: 'RAM 16GB, SSD 512GB, M3 Pro' },
  { key: 'features', label: 'Онцлог', type: 'list', placeholder: 'дагалдах хэрэгсэл, нэмэлт боломж' },
];

const SERVICE_FIELDS: ListingMetadataField[] = [
  { key: 'address', label: 'Байршил', type: 'text', placeholder: 'СБД, 1-р хороо' },
  { key: 'duration', label: 'Үргэлжлэх хугацаа, мин', type: 'number', placeholder: '60' },
  { key: 'packageName', label: 'Багц / үйлчилгээний нэр', type: 'text', placeholder: 'Стандарт багц' },
  { key: 'availableSlots', label: 'Өдөрт авах боломжтой захиалга', type: 'number', placeholder: '8' },
  { key: 'warranty', label: 'Баталгаа', type: 'text', placeholder: '7 хоног' },
  { key: 'highlights', label: 'Давуу тал', type: 'list', placeholder: 'туршлагатай баг, гэрээр очно, түргэн шуурхай' },
];

const GENERIC_PRODUCT_FIELDS: ListingMetadataField[] = [
  { key: 'brand', label: 'Брэнд', type: 'text', placeholder: 'Брэнд нэр' },
  { key: 'model', label: 'Загвар', type: 'text', placeholder: 'Загвар / код' },
  { key: 'condition', label: 'Төлөв', type: 'select', options: ['Шинэ', 'Бараг шинэ', 'Хэрэглэсэн', 'Сэвтэй'] },
  { key: 'warranty', label: 'Баталгаа', type: 'text', placeholder: '7 хоног / 1 сар' },
  { key: 'features', label: 'Онцлог', type: 'list', placeholder: 'өнгө, хэмжээ, материал, багц' },
];

const SERVICE_ROOTS = new Set([
  'education-training',
  'beauty-services',
  'tech-it-services',
  'professional-consulting',
  'auto-services',
  'repair-services',
  'printing-services',
  'manufacturing-custom',
  'photo-video',
  'design-creative',
]);

export function metadataFieldsForCategory(category?: string | null): ListingMetadataField[] {
  const root = normalizeMarketplaceCategory(category);
  if (root === 'vehicles') return VEHICLE_FIELDS;
  if (root === 'real-estate') return REAL_ESTATE_FIELDS;
  if (root === 'new-buildings') return NEW_BUILDING_FIELDS;
  if (root === 'phones') return PHONE_FIELDS;
  if (root === 'technology' || root === 'digital-goods' || root === 'esports') return TECHNOLOGY_FIELDS;
  if (SERVICE_ROOTS.has(root)) return SERVICE_FIELDS;
  if (!category || root === 'all') return [];
  return GENERIC_PRODUCT_FIELDS;
}

export function requiredMetadataComplete(fields: ListingMetadataField[], draft: ListingMetadataDraft): boolean {
  return fields.every((field) => {
    if (!field.required) return true;
    return Boolean((draft[field.key] || '').trim());
  });
}

export function normalizeListingMetadata(
  fields: ListingMetadataField[],
  draft: ListingMetadataDraft,
): ListingMetadataRecord {
  const metadata: ListingMetadataRecord = {};

  for (const field of fields) {
    const raw = draft[field.key];
    if (!raw || !raw.trim()) continue;

    if (field.type === 'number') {
      const parsed = Number(raw.replace(/[,\s₮]/g, ''));
      if (Number.isFinite(parsed)) metadata[field.key] = parsed;
      continue;
    }

    if (field.type === 'boolean') {
      metadata[field.key] = raw === 'true';
      continue;
    }

    if (field.type === 'list') {
      const items = raw
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (items.length > 0) metadata[field.key] = items;
      continue;
    }

    metadata[field.key] = raw.trim();
  }

  return metadata;
}

export function listingMetadataPreviewItems(
  fields: ListingMetadataField[],
  metadata: Record<string, unknown>,
  limit = 6,
): Array<{ key: string; label: string; value: string }> {
  return fields
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: metadataValueToText(metadata[field.key]),
    }))
    .filter((item): item is { key: string; label: string; value: string } => Boolean(item.value))
    .slice(0, limit);
}

export function metadataValueToText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'Тийм' : 'Үгүй';
  if (typeof value === 'number') return value.toLocaleString('mn-MN');
  if (Array.isArray(value)) {
    const text = value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    return text || null;
  }
  const text = String(value).trim();
  return text || null;
}
