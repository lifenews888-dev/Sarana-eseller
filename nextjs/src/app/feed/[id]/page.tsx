import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FeedDetailClient from '@/components/product/FeedDetailClient';
import type { Metadata } from 'next';
import { DEMO_FEED, type FeedItemData } from '@/lib/types/entity';

interface Props {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

const DETAIL_IMAGE = 'https://picsum.photos/seed/eseller-600/600';

function detailImages(seed: string, count = 5): string[] {
  return Array.from({ length: count }, (_, index) => `https://picsum.photos/seed/${seed}-${index + 1}/1000/760`);
}

const DEMO_ENTITY_DETAILS: FeedItemData[] = [
  {
    id: 'v1',
    refId: 'DEMO-AUTO-001',
    title: 'Toyota Land Cruiser 300',
    description: '2024 оны шинэ загвар, үйлдвэрийн баталгаатай, дилерийн үзлэг оношилгоонд орсон. Хот болон хөдөө урт замд тохиромжтой бүрэн тоноглолтой SUV.',
    price: 185000000,
    images: detailImages('autocity-landcruiser'),
    category: 'suv',
    entityType: 'auto_dealer',
    entityId: 'autocity',
    tier: 'featured',
    status: 'active',
    viewCount: 0,
    district: 'БЗД',
    entityName: 'AutoCity Mongolia',
    entityVerified: true,
    createdAt: '2026-04-03',
    metadata: {
      brand: 'Toyota',
      model: 'Land Cruiser 300',
      year: 2024,
      mileage: 5000,
      engine: '3.3 Twin Turbo',
      fuelType: 'Дизель',
      transmission: 'Автомат',
      drivetrain: '4WD',
      color: 'Хар',
      importedFrom: 'Япон',
      condition: 'Маш сайн',
      registrationStatus: 'Монгол дугаартай',
      inspectionValidUntil: '2027-04',
      ownersCount: 1,
      vinLast4: '8F21',
      warranty: '12 сар',
      ownerPhone: '9911-2233',
      features: ['Арьсан салон', '360 камер', 'Суудал халаалт', 'Adaptive cruise', 'Blind spot'],
      documents: ['Гаалийн бичиг', 'Оношилгоо', 'Үйлдвэрийн баталгаа'],
    },
  },
  {
    id: 'v2',
    refId: 'DEMO-AUTO-002',
    title: 'BMW X5 xDrive40i',
    description: '2023 оны BMW X5, xDrive системтэй, хотын болон аяллын хэрэглээнд тохиромжтой. Дилерийн үзлэгийн тэмдэглэлтэй.',
    price: 145000000,
    images: detailImages('autocity-bmw-x5'),
    category: 'suv',
    entityType: 'auto_dealer',
    entityId: 'autocity',
    tier: 'featured',
    status: 'active',
    viewCount: 0,
    district: 'БЗД',
    entityName: 'AutoCity Mongolia',
    entityVerified: true,
    createdAt: '2026-04-03',
    metadata: { brand: 'BMW', model: 'X5 xDrive40i', year: 2023, mileage: 18000, engine: '3.0 бензин', fuelType: 'Бензин', transmission: 'Автомат', drivetrain: 'AWD', color: 'Цагаан', condition: 'Сайн', registrationStatus: 'Монгол дугаартай', ownerPhone: '9911-2233', features: ['Panorama roof', 'Head-up display', 'Суудал хөргөлт'], documents: ['Оношилгоо', 'Даатгал'] },
  },
  {
    id: 'v3',
    refId: 'DEMO-AUTO-003',
    title: 'Toyota Prius 2023',
    description: 'Бага гүйлттэй, түлш бага зарцуулдаг Prius. Хотын өдөр тутмын хэрэглээнд тохиромжтой.',
    price: 52000000,
    images: detailImages('autocity-prius'),
    category: 'sedan',
    entityType: 'auto_dealer',
    entityId: 'autocity',
    tier: 'normal',
    status: 'active',
    viewCount: 0,
    district: 'БЗД',
    entityName: 'AutoCity Mongolia',
    entityVerified: true,
    createdAt: '2026-04-03',
    metadata: { brand: 'Toyota', model: 'Prius', year: 2023, mileage: 12000, fuelType: 'Hybrid', transmission: 'Автомат', color: 'Саарал', condition: 'Сайн', ownerPhone: '9911-2233', features: ['Эко горим', 'Камер', 'Keyless'], documents: ['Гэрчилгээ', 'Оношилгоо'] },
  },
  {
    id: 'v4',
    refId: 'DEMO-AUTO-004',
    title: 'Hyundai Tucson 2024',
    description: 'Шинэ Tucson, гэр бүлийн хэрэглээнд тохиромжтой, дулаан гаражид хадгалсан.',
    price: 78000000,
    images: detailImages('autocity-tucson'),
    category: 'suv',
    entityType: 'auto_dealer',
    entityId: 'autocity',
    tier: 'featured',
    status: 'active',
    viewCount: 0,
    district: 'БЗД',
    entityName: 'AutoCity Mongolia',
    entityVerified: true,
    createdAt: '2026-04-03',
    metadata: { brand: 'Hyundai', model: 'Tucson', year: 2024, mileage: 3000, fuelType: 'Бензин', transmission: 'Автомат', drivetrain: 'AWD', color: 'Хөх', condition: 'Шинэ', ownerPhone: '9911-2233', features: ['Remote start', 'Lane assist', 'CarPlay'], documents: ['Гэрчилгээ', 'Баталгаа'] },
  },
  { id: 'v5', refId: 'DEMO-AUTO-005', title: 'Kia Sportage 2023', description: '2023 оны Sportage, цэвэрхэн салонтой, оношилгоонд орсон.', price: 65000000, images: detailImages('autocity-sportage', 4), category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Kia', model: 'Sportage', year: 2023, mileage: 22000, fuelType: 'Бензин', transmission: 'Автомат', color: 'Мөнгөлөг', ownerPhone: '9911-2233', features: ['Камер', 'Суудал халаалт'], documents: ['Гэрчилгээ'] } },
  { id: 'v6', refId: 'DEMO-AUTO-006', title: 'Honda CR-V 2022', description: 'Найдвартай гэр бүлийн SUV, тогтмол үйлчилгээ хийлгэсэн.', price: 58000000, images: detailImages('autocity-crv', 4), category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Honda', model: 'CR-V', year: 2022, mileage: 35000, fuelType: 'Бензин', transmission: 'Автомат', drivetrain: 'AWD', color: 'Хар', ownerPhone: '9911-2233', features: ['AWD', 'Eco mode', 'Камер'], documents: ['Гэрчилгээ', 'Оношилгоо'] } },

  {
    id: 'p1',
    refId: 'DEMO-COMPANY-001',
    title: 'Zaisan Heights',
    description: 'Зайсангийн аманд байрлах шинэ орон сууцны төсөл. Уулын үзэмж, ногоон байгууламж, гэр бүлийн амьдралд зориулсан төлөвлөлттэй.',
    price: 95000000,
    images: detailImages('mongolian-properties-zaisan-heights'),
    category: 'new_building',
    entityType: 'company',
    entityId: 'mongolian-properties',
    tier: 'vip',
    status: 'active',
    viewCount: 0,
    district: 'ХУД',
    entityName: 'Монголиан Пропертиз',
    entityVerified: true,
    createdAt: '2026-04-02',
    metadata: {
      projectStatus: 'Борлуулж байна',
      address: 'ХУД, Зайсан',
      totalUnits: 240,
      soldUnits: 180,
      availableUnits: 60,
      pricePerSqm: 95000000,
      completionDate: '2027',
      floors: 24,
      parking: 'Дулаан зогсоол',
      ownerPhone: '7711-0000',
      roomChoices: ['2 өрөө 58м²', '3 өрөө 92м²', '4 өрөө 128м²'],
      amenities: ['Хүүхдийн талбай', 'Фитнес', 'Хаалттай хотхон', 'Ногоон байгууламж'],
      paymentTerms: ['Урьдчилгаа 30%', 'Банкны зээл', 'Хувааж төлөх нөхцөл'],
    },
  },
  { id: 'p2', refId: 'DEMO-COMPANY-002', title: 'Central Park Residence', description: 'Хотын төвийн ойролцоох premium residence төсөл. Ажлын байр, үйлчилгээ, сургууль цэцэрлэгтэй ойр.', price: 120000000, images: detailImages('mongolian-properties-central-park'), category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'featured', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Барьж байна', address: 'СБД, 1-р хороо', totalUnits: 180, soldUnits: 81, availableUnits: 99, pricePerSqm: 120000000, completionDate: '2028', floors: 18, parking: 'Дулаан болон гадна зогсоол', ownerPhone: '7711-0000', roomChoices: ['1 өрөө 42м²', '2 өрөө 68м²', '3 өрөө 105м²'], amenities: ['Консьерж', 'Камерын хяналт', 'Лобби'], paymentTerms: ['Урьдчилгаа 40%', 'Банкны зээл'] } },
  { id: 'p3', refId: 'DEMO-COMPANY-003', title: 'Green Valley', description: 'Ашиглалтад орсон ногоон хотхон. Шууд нүүж орох боломжтой үлдэгдэл цөөн байртай.', price: 78000000, images: detailImages('mongolian-properties-green-valley'), category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'featured', status: 'active', viewCount: 0, district: 'БГД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Ашиглалтад орсон', address: 'БГД, 3-р хороолол', totalUnits: 320, soldUnits: 320, availableUnits: 4, pricePerSqm: 78000000, completionDate: '2025', floors: 16, parking: 'Дулаан зогсоол', ownerPhone: '7711-0000', roomChoices: ['2 өрөө 55м²', '3 өрөө 88м²'], amenities: ['Сургууль ойр', 'Ногоон бүс', 'Хүүхдийн талбай'], paymentTerms: ['Шууд төлөлт', 'Ипотек'] } },
  { id: 'p4', refId: 'DEMO-COMPANY-004', title: 'River Garden II', description: 'Төлөвлөлтийн шатанд буй River Garden II төсөл. Эрт захиалгын нөхцөлтэй.', price: 135000000, images: detailImages('mongolian-properties-river-garden'), category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'normal', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Төлөвлөж байна', address: 'СБД, Туул голын эрэг', totalUnits: 150, soldUnits: 15, availableUnits: 135, pricePerSqm: 135000000, completionDate: '2029', floors: 20, parking: 'Төлөвлөсөн дулаан зогсоол', ownerPhone: '7711-0000', roomChoices: ['2 өрөө', '3 өрөө', 'Пентхаус'], amenities: ['Голын эрэг', 'Хаалттай хотхон'], paymentTerms: ['Захиалгын гэрээ', 'Хувааж төлөх'] } },

  {
    id: 'l1',
    refId: 'DEMO-AGENT-001',
    title: '3 өрөө байр, Ривер Гарден',
    description: 'Ривер Гарден хотхонд байрлах 98м², 3 өрөө орон сууц. Урагшаа болон баруун харсан цонхтой, гэр бүл амьдрахад тохиромжтой төлөвлөлттэй. Гал тогоо тусдаа, мастер унтлагын өрөөтэй, дулаан зогсоолын сонголттой. Үл хөдлөхийн гэрчилгээ бэлэн тул банкны зээлээр авах боломжтой.',
    price: 450000000,
    images: detailImages('agent-erdenbat-river-garden', 6),
    category: 'apartment',
    entityType: 'agent',
    entityId: 'erdenbat',
    tier: 'vip',
    status: 'active',
    viewCount: 0,
    district: 'СБД',
    entityName: 'Б. Эрдэнэбат',
    entityVerified: true,
    createdAt: '2026-04-03',
    metadata: {
      propertyType: 'Орон сууц',
      listingType: 'Худалдах',
      buildingName: 'River Garden',
      address: 'СБД, Туул голын эрэг',
      district: 'СБД',
      microDistrict: 'River Garden хотхон',
      landmark: 'River Garden clubhouse ойролцоо',
      sqm: 98,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
      floor: 12,
      totalFloors: 24,
      balcony: '2 тагт',
      windowCount: 5,
      orientation: 'Урагшаа, баруун',
      condition: 'Шинэ засвар',
      furnishing: 'Хагас тавилгатай',
      parking: 'Дулаан зогсоол тусдаа тохиролцоно',
      garage: 'Байгаа',
      ownershipType: 'Хувийн өмч',
      certificateReady: true,
      mortgageAvailable: true,
      maintenanceFeeMnt: 220000,
      pricePerSqm: 4591837,
      builtYear: 2021,
      buildingType: 'Бүрэн цутгамал',
      heating: 'Төвийн халаалт',
      moveInDate: 'Шууд нүүж орно',
      ownerPhone: '9900-1122',
      highlights: ['Голын эрэгтэй ойр', 'Хаалттай хотхон', '24/7 хамгаалалт', 'Гэрчилгээ бэлэн', 'Дулаан зогсоолтой'],
      nearby: ['Сургууль 5 минут', 'Цэцэрлэг 3 минут', 'Хүнсний дэлгүүр', 'Фитнес клуб', 'Автобусны буудал 400м'],
      amenities: ['Хүүхдийн талбай', 'Ногоон байгууламж', 'Камерын хяналт', 'Clubhouse'],
      documents: ['Үл хөдлөхийн гэрчилгээ', 'Кадастрын зураг', 'СӨХ төлбөрийн лавлагаа'],
    },
  },
  { id: 'l2', refId: 'DEMO-AGENT-002', title: '2 өрөө, 13-р хороолол', description: '65м² 2 өрөө байр. Сургууль, цэцэрлэг, үйлчилгээтэй ойр, шууд нүүж орох боломжтой.', price: 180000000, images: detailImages('agent-erdenbat-13-khoroolol', 5), category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { propertyType: 'Орон сууц', listingType: 'Худалдах', address: 'БЗД, 13-р хороолол', sqm: 65, rooms: 2, bedrooms: 1, bathrooms: 1, floor: 6, totalFloors: 12, condition: 'Сайн', furnishing: 'Тавилгагүй', certificateReady: true, mortgageAvailable: true, pricePerSqm: 2769231, ownerPhone: '9900-1122', highlights: ['Сургууль ойр', 'Цэвэрхэн орц', 'Зээлээр авах боломжтой'], nearby: ['Нарантуул зах', 'Автобусны буудал', 'Хүнсний дэлгүүр'], documents: ['Үл хөдлөхийн гэрчилгээ'] } },
  { id: 'l3', refId: 'DEMO-AGENT-003', title: '4 өрөө пентхаус, Zaisan', description: 'Зайсанд байрлах 180м² пентхаус. Панорам цонх, том тагт, premium засвартай.', price: 780000000, images: detailImages('agent-erdenbat-zaisan-penthouse', 6), category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'vip', status: 'active', viewCount: 0, district: 'ХУД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { propertyType: 'Пентхаус', listingType: 'Худалдах', address: 'ХУД, Зайсан', sqm: 180, rooms: 4, bedrooms: 3, bathrooms: 3, floor: 18, totalFloors: 18, balcony: 'Том тагт', orientation: 'Урагшаа', condition: 'Premium засвар', furnishing: 'Бүрэн тавилгатай', parking: '2 дулаан зогсоол', certificateReady: true, mortgageAvailable: false, pricePerSqm: 4333333, ownerPhone: '9900-1122', highlights: ['Уулын үзэмж', 'Дээд давхар', '2 зогсоол'], nearby: ['Зайсан толгой', 'Олон улсын сургууль'], documents: ['Үл хөдлөхийн гэрчилгээ', 'Зогсоолын гэрээ'] } },
  { id: 'l4', refId: 'DEMO-AGENT-004', title: 'Оффис, Central Tower', description: '120м² оффисын талбай, хотын төвд байрлалтай. Байгууллагын оффис, үйлчилгээний зориулалтаар ашиглах боломжтой.', price: 3500000, images: detailImages('agent-erdenbat-central-tower', 4), category: 'office', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { propertyType: 'Оффис', listingType: 'Түрээс', address: 'СБД, Central Tower', sqm: 120, rooms: 4, floor: 9, totalFloors: 16, condition: 'Оффис засвартай', furnishing: 'Ширээ сандал тохиролцоно', maintenanceFeeMnt: 180000, ownerPhone: '9900-1122', highlights: ['Хотын төв', 'Лифттэй', 'Хүлээн авах хэсэгтэй'], nearby: ['Төв талбай', 'Банк', 'Кофе шоп'], documents: ['Түрээсийн гэрээ'] } },
  { id: 'l5', refId: 'DEMO-AGENT-005', title: '1 өрөө студио, Хан-Уул', description: '38м² студио байр, ганц бие болон залуу гэр бүлд тохиромжтой. Шинэ хотхонд байрлалтай.', price: 95000000, images: detailImages('agent-erdenbat-studio-khan-uul', 4), category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'ХУД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { propertyType: 'Студио', listingType: 'Худалдах', address: 'ХУД', sqm: 38, rooms: 1, bathrooms: 1, floor: 8, totalFloors: 16, condition: 'Шинэ', furnishing: 'Тавилгагүй', certificateReady: true, mortgageAvailable: true, pricePerSqm: 2500000, ownerPhone: '9900-1122', highlights: ['Шинэ байр', 'Зээл боломжтой'], nearby: ['Хүннү молл', 'Автобусны буудал'], documents: ['Үл хөдлөхийн гэрчилгээ'] } },
  { id: 'l6', refId: 'DEMO-AGENT-006', title: 'Газар 500м², Налайх', description: 'Налайхад 500м² өмчилсөн газар. Төв замтай ойр, хашаатай.', price: 45000000, images: detailImages('agent-erdenbat-nalaikh-land', 4), category: 'land', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'НД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { propertyType: 'Газар', listingType: 'Худалдах', address: 'НД, төв замаас 1.2км', sqm: 500, rooms: 0, ownershipType: 'Өмчилсөн', certificateReady: true, mortgageAvailable: false, ownerPhone: '9900-1122', highlights: ['Хашаатай', 'Төв замтай ойр', 'Цахилгаан татах боломжтой'], nearby: ['Төв зам', 'Дэлгүүр'], documents: ['Газрын гэрчилгээ', 'Кадастрын зураг'] } },
];

const DEMO_DETAIL_ID_ALIASES: Record<string, string> = {
  '1': 'l1',
  '2': 'v3',
  '3': 'p1',
  f1: 'l1',
  f2: 'p1',
  f3: 'v3',
  f7: 'l2',
  f8: 'v4',
  f10: 'l4',
};

function getDemoPost(id: string) {
  const detailId = DEMO_DETAIL_ID_ALIASES[id] || id;
  return [...DEMO_ENTITY_DETAILS, ...DEMO_FEED].find((item) => item.id === detailId);
}

function metadataString(metadata: FeedItemData['metadata'], key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function entityProfileHref(entityType: string, slug?: string | null): string | undefined {
  if (!slug) return undefined;
  return ['agent', 'company', 'auto_dealer', 'service'].includes(entityType)
    ? `/entity/${entityType}/${slug}`
    : undefined;
}

const DEMO_ENTITY_SLUGS: Record<string, Record<string, string>> = {
  agent: { a1: 'erdenbat', erdenbat: 'erdenbat' },
  company: { c1: 'mongolian-properties', 'mongolian-properties': 'mongolian-properties' },
  auto_dealer: { ad1: 'autocity', autocity: 'autocity' },
};

function demoEntityProfileHref(entityType: string, entityId?: string | null): string | undefined {
  const slug = entityId ? DEMO_ENTITY_SLUGS[entityType]?.[entityId] : undefined;
  return entityProfileHref(entityType, slug);
}

function toClientPost(item: FeedItemData) {
  const images = item.images.length > 0 ? item.images : [DETAIL_IMAGE];
  return {
    ...item,
    _id: item.id,
    images,
    media: images.map((url, sortOrder) => ({
      id: `${item.id}-${sortOrder}`,
      type: 'IMAGE' as const,
      url,
      sortOrder,
    })),
    owner: item.entityName
      ? {
          name: item.entityName,
          phone: metadataString(item.metadata, 'ownerPhone'),
          href: demoEntityProfileHref(item.entityType, item.entityId),
        }
      : null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    const post = getDemoPost(id);
    return post
      ? { title: `${post.title} — eseller.mn`, description: post.description?.slice(0, 160) || post.title }
      : { title: 'Олдсонгүй' };
  }
  let post;
  try {
    post = await prisma.feedItem.findUnique({ where: { id }, select: { title: true, description: true, images: true } });
  } catch { return { title: 'Олдсонгүй' }; }
  if (!post) return { title: 'Олдсонгүй' };
  return {
    title: `${post.title} — eseller.mn`,
    description: post.description?.slice(0, 160) || post.title,
    openGraph: {
      title: post.title,
      description: post.description?.slice(0, 160) || post.title,
      images: post.images?.[0] ? [post.images[0]] : [],
    },
  };
}

export default async function FeedDetailPage({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    const demoPost = getDemoPost(id);
    if (!demoPost) notFound();
    return <FeedDetailClient post={toClientPost(demoPost)} />;
  }

  let post;
  try {
    post = await prisma.feedItem.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        agent: { select: { id: true, name: true, phone: true, slug: true } },
        company: { select: { id: true, name: true, phone: true, slug: true } },
        autoDealer: { select: { id: true, name: true, phone: true, slug: true } },
        serviceProvider: { select: { id: true, name: true, phone: true, slug: true } },
      },
    });
  } catch { notFound(); }

  if (!post) notFound();

  const owner = post.agent || post.company || post.autoDealer || post.serviceProvider;

  const clientPost = {
    _id: post.id,
    title: post.title,
    description: post.description || undefined,
    price: post.price || undefined,
    originalPrice: post.originalPrice || undefined,
    images: post.images,
    entityType: post.entityType,
    metadata: post.metadata && typeof post.metadata === 'object' && !Array.isArray(post.metadata)
      ? post.metadata as Record<string, unknown>
      : undefined,
    district: post.district || undefined,
    province: post.province || undefined,
    allowAffiliate: post.allowAffiliate,
    affiliateCommission: post.affiliateCommission || undefined,
    media: post.media.map((m) => ({
      id: m.id,
      type: m.type as 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'FLOOR_PLAN',
      url: m.url,
      thumbnail: m.thumbnail || undefined,
      caption: m.caption || undefined,
      sortOrder: m.sortOrder,
    })),
    owner: owner
      ? {
          name: owner.name,
          phone: owner.phone || undefined,
          href: entityProfileHref(post.entityType, owner.slug),
        }
      : null,
    createdAt: post.createdAt.toISOString(),
  };

  return <FeedDetailClient post={clientPost} />;
}
