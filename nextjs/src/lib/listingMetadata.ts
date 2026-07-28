import { categoryPathInfo, normalizeMarketplaceCategory } from './marketplaceCategories';

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

const JOB_FIELDS: ListingMetadataField[] = [
  { key: 'jobType', label: 'Ажлын хэлбэр', type: 'select', required: true, options: ['Бүтэн цагийн', 'Цагийн', 'Түр / гэрээт', 'Дадлага', 'Зайнаас'] },
  { key: 'positionTitle', label: 'Албан тушаал', type: 'text', required: true, placeholder: 'Борлуулалтын ажилтан' },
  { key: 'employerName', label: 'Ажил олгогч', type: 'text', required: true, placeholder: 'eseller.mn / байгууллагын нэр' },
  { key: 'workplaceType', label: 'Ажиллах орчин', type: 'select', required: true, options: ['Байршил дээр', 'Холимог', 'Зайнаас'] },
  { key: 'schedule', label: 'Хуваарь', type: 'text', required: true, placeholder: 'Даваа-Баасан 09:00-18:00 / Орой 18:00-22:00' },
  { key: 'salaryPeriod', label: 'Цалингийн төрөл', type: 'select', required: true, options: ['Сарын', 'Цагийн', 'Өдрийн', 'Гэрээт', 'Тохиролцоно'] },
  { key: 'salaryMin', label: 'Цалин доод', type: 'number', placeholder: '1500000' },
  { key: 'salaryMax', label: 'Цалин дээд', type: 'number', placeholder: '2200000' },
  { key: 'hourlyRate', label: 'Цагийн үнэлгээ', type: 'number', placeholder: '8000' },
  { key: 'openPositions', label: 'Авах хүний тоо', type: 'number', placeholder: '3' },
  { key: 'experienceLevel', label: 'Туршлага', type: 'select', options: ['Туршлага шаардахгүй', '1+ жил', '2+ жил', '3+ жил', 'Мэргэжлийн'] },
  { key: 'requirements', label: 'Шаардлага', type: 'list', placeholder: 'харилцааны чадвартай, цаг баримталдаг, багаар ажиллана' },
  { key: 'responsibilities', label: 'Гүйцэтгэх ажил', type: 'list', placeholder: 'үйлчлүүлэгч зөвлөх, захиалга авах, тайлан гаргах' },
  { key: 'benefits', label: 'Давуу тал', type: 'list', placeholder: 'хоол, унаа, бонус, сургалт, даатгал' },
  { key: 'applicationMethod', label: 'Анкет авах хэлбэр', type: 'select', required: true, options: ['Утсаар', 'Чатаар', 'Имэйлээр', 'Биечлэн', 'Линкээр'] },
  { key: 'applicationDeadline', label: 'Дуусах огноо', type: 'text', placeholder: '2026-08-15' },
  { key: 'studentFriendly', label: 'Оюутанд тохиромжтой', type: 'boolean' },
  { key: 'noExperienceRequired', label: 'Туршлага шаардахгүй', type: 'boolean' },
  { key: 'remoteAllowed', label: 'Зайнаас хийх боломжтой', type: 'boolean' },
  { key: 'mealsIncluded', label: 'Хоолтой', type: 'boolean' },
  { key: 'transportIncluded', label: 'Унаатай', type: 'boolean' },
];

const GENERIC_PRODUCT_FIELDS: ListingMetadataField[] = [
  { key: 'brand', label: 'Брэнд', type: 'text', placeholder: 'Брэнд нэр' },
  { key: 'model', label: 'Загвар', type: 'text', placeholder: 'Загвар / код' },
  { key: 'productType', label: 'Барааны төрөл', type: 'text', placeholder: 'Гал тогооны хэрэгсэл / тавилга / хэрэгсэл' },
  { key: 'condition', label: 'Төлөв', type: 'select', options: ['Шинэ', 'Бараг шинэ', 'Хэрэглэсэн', 'Сэвтэй'] },
  { key: 'material', label: 'Материал', type: 'text', placeholder: 'Металл / мод / даавуу' },
  { key: 'size', label: 'Хэмжээ', type: 'text', placeholder: 'L / 120x80см / 750W' },
  { key: 'color', label: 'Өнгө', type: 'text', placeholder: 'Хар / саарал / цагаан' },
  { key: 'usageDuration', label: 'Хэрэглэсэн хугацаа', type: 'text', placeholder: '6 сар / 1 жил' },
  { key: 'warranty', label: 'Баталгаа', type: 'text', placeholder: '7 хоног / 1 сар' },
  { key: 'deliveryOptions', label: 'Хүргэлт', type: 'list', placeholder: 'өөрөө авна, хүргэлт тохиролцоно' },
  { key: 'pickupLocation', label: 'Үзэх/авах байршил', type: 'text', placeholder: 'ЧД, 6-р хороо' },
  { key: 'negotiable', label: 'Үнэ тохиролцох боломжтой', type: 'boolean' },
  { key: 'includedItems', label: 'Иж бүрдэл', type: 'list', placeholder: 'хайрцаг, дагалдах хэрэгсэл, нэмэлт эд анги' },
  { key: 'checks', label: 'Шалгасан зүйлс', type: 'list', placeholder: 'асаалт хэвийн, сэвгүй, бүрэн ажиллагаатай' },
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

function modelFromPathParts(parts: string[]): string | undefined {
  const clean = parts.map((part) => part.trim()).filter(Boolean);
  if (clean.length === 0) return undefined;

  return clean.reduce((model, part) => {
    if (!model) return part;

    const modelParts = model.split(/\s+/);
    const last = modelParts[modelParts.length - 1] || '';
    if (last && part.toLowerCase().startsWith(last.toLowerCase())) {
      const prefix = modelParts.slice(0, -1).join(' ');
      return [prefix, part].filter(Boolean).join(' ');
    }

    return `${model} ${part}`;
  }, '');
}

function inferPhoneBrand(label?: string): string | undefined {
  if (!label) return undefined;
  if (/apple|iphone/i.test(label)) return 'Apple';
  if (/samsung|galaxy/i.test(label)) return 'Samsung';
  if (/xiaomi|redmi|poco/i.test(label)) return 'Xiaomi';
  if (/huawei/i.test(label)) return 'Huawei';
  if (/google|pixel/i.test(label)) return 'Google';
  return label;
}

function roomCountFromLabel(label: string): string | undefined {
  if (/студи/i.test(label)) return '1';
  const match = label.match(/(\d+)/);
  return match ? match[1] : undefined;
}

function inferNewBuildingProjectStatus(label: string): string | undefined {
  if (label === 'Ашиглалтад орсон') return 'Ашиглалтад орсон';
  if (label === 'Барьж байгаа') return 'Баригдаж байна';
  if (label === 'Төлөвлөж байгаа') return 'Төлөвлөж байна';
  if (label === 'Урьдчилсан захиалга') return 'Төлөвлөж байна';
  return undefined;
}

function setIfMissing(
  draft: ListingMetadataDraft,
  key: string,
  value?: string,
) {
  if (value && !draft[key]) draft[key] = value;
}

export function inferListingMetadataDraftFromCategory(category?: string | null): ListingMetadataDraft {
  const path = categoryPathInfo(category);
  if (!path) return {};

  const root = normalizeMarketplaceCategory(category);
  const labels = path.labels.slice(1);
  const draft: ListingMetadataDraft = {};

  if (root === 'vehicles') {
    const [brand, ...modelParts] = labels;
    setIfMissing(draft, 'brand', brand);
    setIfMissing(draft, 'model', modelFromPathParts(modelParts));
    return draft;
  }

  if (root === 'phones') {
    const [brandLabel, ...modelParts] = labels;
    setIfMissing(draft, 'brand', inferPhoneBrand(brandLabel));
    setIfMissing(draft, 'model', modelFromPathParts(modelParts));
    return draft;
  }

  if (root === 'real-estate') {
    const [propertyLabel, ...detailLabels] = labels;
    const propertyTypeMap: Record<string, string> = {
      'Орон сууц': 'Орон сууц',
      'Хаус': 'Хаус',
      'Оффис': 'Оффис',
      'Газар': 'Газар',
      'Пентхаус': 'Орон сууц',
      'Агуулах': 'Агуулах',
      'Зуслан': 'Зуслан',
    };
    setIfMissing(draft, 'propertyType', propertyTypeMap[propertyLabel] || propertyLabel);

    for (const label of detailLabels) {
      if (label.includes('өрөө') || /студи/i.test(label)) setIfMissing(draft, 'rooms', roomCountFromLabel(label));
      if (label.includes('Тавилгатай')) setIfMissing(draft, 'furnishing', 'Бүрэн тавилгатай');
      if (label.includes('Тавилгагүй')) setIfMissing(draft, 'furnishing', 'Тавилгагүй');
      if (label.includes('түрээс')) setIfMissing(draft, 'listingType', 'Түрээслэх');
      if (label.includes('худалдах')) setIfMissing(draft, 'listingType', 'Худалдах');
      if (label.includes('Өмчилсөн')) setIfMissing(draft, 'ownershipType', 'Хувийн өмч');
    }

    return draft;
  }

  if (root === 'new-buildings') {
    const status = labels.map(inferNewBuildingProjectStatus).find(Boolean);
    if (status) {
      setIfMissing(draft, 'projectStatus', status);
    }

    const roomChoice = labels.find((label) => label.includes('өрөө'));
    setIfMissing(draft, 'roomChoices', roomChoice);
    return draft;
  }

  if (root === 'jobs') {
    const labelText = labels.join(' ').toLowerCase();
    const leaf = path.leafLabel;
    if (/part-time|hourly|цагийн|оюут/i.test(labelText)) {
      setIfMissing(draft, 'jobType', 'Цагийн');
      setIfMissing(draft, 'salaryPeriod', 'Цагийн');
    } else if (/contract|temporary|түр|гэрээт/i.test(labelText)) {
      setIfMissing(draft, 'jobType', 'Түр / гэрээт');
      setIfMissing(draft, 'salaryPeriod', 'Гэрээт');
    } else if (/intern|дадлага|entry/i.test(labelText)) {
      setIfMissing(draft, 'jobType', 'Дадлага');
      setIfMissing(draft, 'salaryPeriod', 'Тохиролцоно');
    } else if (/remote|зайнаас/i.test(labelText)) {
      setIfMissing(draft, 'jobType', 'Зайнаас');
      setIfMissing(draft, 'salaryPeriod', 'Сарын');
      setIfMissing(draft, 'workplaceType', 'Зайнаас');
      setIfMissing(draft, 'remoteAllowed', 'true');
    } else {
      setIfMissing(draft, 'jobType', 'Бүтэн цагийн');
      setIfMissing(draft, 'salaryPeriod', 'Сарын');
    }
    setIfMissing(draft, 'positionTitle', leaf);
    setIfMissing(draft, 'workplaceType', draft.workplaceType || 'Байршил дээр');
    return draft;
  }

  if (SERVICE_ROOTS.has(root)) {
    setIfMissing(draft, 'packageName', labels[labels.length - 1]);
    return draft;
  }

  if (category && root !== 'all') {
    setIfMissing(draft, 'productType', labels[labels.length - 1] || path.leafLabel);
  }

  return draft;
}

export function metadataFieldsForCategory(category?: string | null): ListingMetadataField[] {
  const root = normalizeMarketplaceCategory(category);
  if (root === 'vehicles') return VEHICLE_FIELDS;
  if (root === 'real-estate') return REAL_ESTATE_FIELDS;
  if (root === 'new-buildings') return NEW_BUILDING_FIELDS;
  if (root === 'jobs') return JOB_FIELDS;
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
