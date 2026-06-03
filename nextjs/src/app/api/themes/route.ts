import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Demo themes (used as fallback when DB is empty)
const DEMO_THEMES = [
  { id: '1', name: 'Цагаан Орд', slug: 'tsagaan-ord', style: 'minimal', price: 0, description: 'Цэвэр цагаан, бараа онцолсон минималист загвар', previewClass: 'preview-minimal', entityTypes: ['store', 'preorder'], features: ['dark_mode', 'infinite_scroll'], industry: ['fashion', 'tech'], rating: 98, reviewCount: 142, isNew: false, isPopular: true, isFeatured: false },
  { id: '2', name: 'Улаан Буллет', slug: 'ulaan-bullet', style: 'bold', price: 29900, description: 'Хүчтэй улаан, том typography — бизнест зориулсан', previewClass: 'preview-bold', entityTypes: ['store', 'service'], features: ['dark_mode', 'gallery', 'video_hero'], industry: ['fashion', 'service'], rating: 96, reviewCount: 89, isNew: true, isPopular: true, isFeatured: true },
  { id: '3', name: 'Хар Тунгрүн', slug: 'khar-tungrun', style: 'modern', price: 49900, description: 'Орчин үеийн хар дэвсгэртэй авто мэргэжилтэй загвар', previewClass: 'preview-modern', entityTypes: ['auto', 'store'], features: ['dark_mode', 'gallery', 'map'], industry: ['auto', 'tech'], rating: 94, reviewCount: 67, isNew: false, isPopular: false, isFeatured: false },
  { id: '4', name: 'Алтан Өлгий', slug: 'altan-olgii', style: 'luxury', price: 79900, description: 'Тансаг хар-алтан өнгөний үл хөдлөхийн агентлагт', previewClass: 'preview-luxury', entityTypes: ['agent', 'company'], features: ['dark_mode', 'map', 'gallery'], industry: ['realestate'], rating: 99, reviewCount: 34, isNew: true, isPopular: false, isFeatured: true },
  { id: '5', name: 'Ногоон Нуга', slug: 'nogoon-nuga', style: 'minimal', price: 0, description: 'Байгалийн ногоон — хоол, эрүүл мэнд, органик', previewClass: 'preview-nature', entityTypes: ['store', 'service'], features: ['infinite_scroll', 'gallery'], industry: ['food', 'service'], rating: 91, reviewCount: 203, isNew: false, isPopular: true, isFeatured: false },
  { id: '6', name: 'Далайн Хөх', slug: 'dalain-khokh', style: 'modern', price: 39900, description: 'Цэнхэр орчин үеийн дижитал контент, программ', previewClass: 'preview-ocean', entityTypes: ['digital', 'service'], features: ['dark_mode', 'video_hero', 'infinite_scroll'], industry: ['digital', 'tech'], rating: 97, reviewCount: 118, isNew: false, isPopular: true, isFeatured: false },
  { id: '7', name: 'Цөлийн Элс', slug: 'tsoliin-els', style: 'luxury', price: 59900, description: 'Авто дилерийн тансаг, мэргэжлийн загвар', previewClass: 'preview-luxury', entityTypes: ['auto'], features: ['dark_mode', 'gallery', 'map'], industry: ['auto'], rating: 93, reviewCount: 45, isNew: false, isPopular: false, isFeatured: false },
  { id: '8', name: 'Мөнгөн Шил', slug: 'mongon-shil', style: 'minimal', price: 0, description: 'Цэвэр мөнгөлөг — электроник, технологийн бүтээгдэхүүнд', previewClass: 'preview-minimal', entityTypes: ['store', 'digital'], features: ['infinite_scroll', 'dark_mode'], industry: ['tech', 'digital'], rating: 88, reviewCount: 176, isNew: true, isPopular: false, isFeatured: false },
  { id: '9', name: 'Эрдэнэс', slug: 'erdenes', style: 'bold', price: 29900, description: 'Pre-order болон batch захиалгын мэргэжилтэй загвар', previewClass: 'preview-bold', entityTypes: ['preorder'], features: ['dark_mode'], industry: ['fashion'], rating: 95, reviewCount: 92, isNew: false, isPopular: true, isFeatured: false },
  { id: '10', name: 'Урлын Цаг', slug: 'urlyn-tsag', style: 'minimal', price: 19900, description: 'Цагаан өнгөтэнх — олон ангиллын дэлгүүрт', previewClass: 'preview-minimal', entityTypes: ['store', 'service'], features: ['gallery', 'infinite_scroll'], industry: ['fashion', 'service'], rating: 97, reviewCount: 156, isNew: false, isPopular: true, isFeatured: false },
  { id: '11', name: 'Бүтээл', slug: 'buteeel', style: 'modern', price: 0, description: 'Барилгын компаний орчин үеийн, мэргэжлийн загвар', previewClass: 'preview-modern', entityTypes: ['company'], features: ['dark_mode', 'map', 'gallery'], industry: ['realestate'], rating: 90, reviewCount: 88, isNew: true, isPopular: false, isFeatured: false },
  { id: '12', name: 'Хорсон Нар', slug: 'khorson-nar', style: 'bold', price: 49900, description: 'Хорсон цэмнүлд нийтсэн үйлчилгээний загвар', previewClass: 'preview-bold', entityTypes: ['service', 'store'], features: ['dark_mode', 'map'], industry: ['service', 'food'], rating: 92, reviewCount: 71, isNew: false, isPopular: false, isFeatured: false },
];

// GET /api/themes — list themes with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'all';
    const search = searchParams.get('q') || '';
    const style = searchParams.get('style');
    const entityType = searchParams.get('entityType');

    // Try DB first
    const themes = await prisma.themeTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    // Fallback to demo if DB empty
    if (themes.length === 0) {
      return NextResponse.json(filterDemoThemes(tab, search, style, entityType));
    }

    return NextResponse.json(themes);
  } catch {
    return NextResponse.json(DEMO_THEMES);
  }
}

function filterDemoThemes(tab: string, search: string, style: string | null, entityType: string | null) {
  let filtered = [...DEMO_THEMES];
  if (tab === 'free') filtered = filtered.filter(t => t.price === 0);
  if (tab === 'popular') filtered = filtered.filter(t => t.isPopular);
  if (tab === 'new') filtered = filtered.filter(t => t.isNew);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }
  if (style) filtered = filtered.filter(t => t.style === style);
  if (entityType) filtered = filtered.filter(t => t.entityTypes.includes(entityType));
  return filtered;
}
