export type MarketplaceCategorySection = 'product' | 'service' | 'listing';

export type MarketplaceCategoryBranch = string | {
  name: string;
  aliases?: string[];
  children?: MarketplaceCategoryBranch[];
};

export type MarketplaceCategory = {
  key: string;
  label: string;
  shortLabel?: string;
  emoji: string;
  icon: string;
  color: string;
  count?: number;
  section: MarketplaceCategorySection;
  entityTypes: string[];
  aliases?: string[];
  subcategories: MarketplaceCategoryBranch[];
};

export type CategoryTreeNode = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  level: number;
  parentId: string | null;
  entityTypes: string[];
  sortOrder: number;
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  children: CategoryTreeNode[];
};

export type MarketplaceCategoryPath = {
  rootKey: string;
  rootLabel: string;
  value: string;
  labels: string[];
  label: string;
  leafLabel: string;
  segments: MarketplaceCategoryPathSegment[];
};

export type MarketplaceCategoryPathSegment = {
  value: string;
  label: string;
  isRoot: boolean;
};

export type MarketplaceCategoryOption = {
  value: string;
  label: string;
  hasChildren: boolean;
  aliases: string[];
};

export const PRODUCT_MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    key: 'jobs',
    label: 'Ажлын зар',
    shortLabel: 'Ажил',
    emoji: '💼',
    icon: 'BriefcaseBusiness',
    color: '#4F46E5',
    section: 'listing',
    entityTypes: ['STORE', 'SERVICE', 'USER', 'COMPANY'],
    aliases: ['job', 'jobs', 'work', 'career', 'hiring', 'part-time', 'part-time-job', 'hourly-job'],
    subcategories: [
      {
        name: 'Бүтэн цагийн ажил',
        aliases: ['full-time'],
        children: ['Оффис', 'Худалдаа үйлчилгээ', 'Ресторан кафе', 'Хүргэлт жолооч', 'IT технологи', 'Борлуулалт маркетинг'],
      },
      {
        name: 'Цагийн ажил',
        aliases: ['part-time', 'hourly'],
        children: ['Өдөр / оройн ээлж', 'Амралтын өдөр', 'Оюутны ажил', 'Event ажил', 'Гэрээс хийх ажил'],
      },
      {
        name: 'Түр ажил / гэрээт',
        aliases: ['contract', 'temporary'],
        children: ['1-7 хоног', 'Улирлын ажил', 'Төслийн ажил'],
      },
      {
        name: 'Дадлага / entry level',
        aliases: ['internship', 'entry-level'],
        children: ['Дадлага', 'Туслах ажилтан', 'Сургалттай ажил'],
      },
      {
        name: 'Зайнаас хийх ажил',
        aliases: ['remote'],
        children: ['Онлайн оператор', 'Контент', 'Дизайн', 'Програмчлал', 'Дата оруулах'],
      },
    ],
  },
  {
    key: 'women',
    label: 'Эмэгтэй',
    emoji: '👗',
    icon: 'Venus',
    color: '#DB2777',
    count: 5323,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['fashion', 'female', 'women-fashion'],
    subcategories: [
      { name: 'Эмэгтэй хувцас', children: ['Даашинз', 'Цамц & футболк', 'Өмд & жинс', 'Гадуур хувцас', 'Үндэсний хувцас'] },
      { name: 'Эмэгтэй гутал', children: ['Пүүз', 'Өсгийтэй гутал', 'Өдөр тутмын гутал', 'Өвлийн гутал'] },
      { name: 'Цүнх & Чемодан', children: ['Гар цүнх', 'Үүргэвч', 'Аяллын чемодан', 'Клатч'] },
      { name: 'Хувцасны аксессуар', children: ['Бүс', 'Ороолт', 'Бээлий', 'Малгай'] },
      'Дотуур хувцас',
    ],
  },
  {
    key: 'men',
    label: 'Эрэгтэй',
    emoji: '👔',
    icon: 'Mars',
    color: '#2563EB',
    count: 1171,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['men-fashion'],
    subcategories: [
      { name: 'Гадуур хувцас', children: ['Куртик', 'Пальто', 'Савхин хүрэм', 'Өвлийн хүрэм'] },
      'Хослол & Пиджак',
      'Өмд & Шорт',
      { name: 'Цамц & Футболко', children: ['Футболк', 'Поло', 'Сорочка', 'Ноосон цамц'] },
      'Спорт өмсгөл',
      { name: 'Эрэгтэй гутал', children: ['Пүүз', 'Гутал', 'Өвлийн гутал', 'Албан гутал'] },
      'Малгай',
      'Үүргэвч & Турийвч',
    ],
  },
  {
    key: 'beauty-health',
    label: 'Гоо сайхан',
    emoji: '💄',
    icon: 'Sparkles',
    color: '#C026D3',
    count: 4432,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['beauty', 'salon'],
    subcategories: ['Арьс арчилгаа', 'Нүүр будалт', 'Үс арчилгаа', 'Витамин', 'Эрүүл мэнд & асаргаа', 'Жирэмсэн & хөхүүл үеийн арчилгаа'],
  },
  {
    key: 'home-decor',
    label: 'Гэр ахуй декор',
    shortLabel: 'Гэр декор',
    emoji: '🏠',
    icon: 'Home',
    color: '#D97706',
    count: 1542,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['home', 'home-living'],
    subcategories: ['Гэрийн декор', 'Гал тогооны хэрэгсэл', 'Угаалга цэвэрлэгээ', 'Ор дэрний хэрэглэл', 'Гэрийн цэцэрлэгжүүлэлт'],
  },
  {
    key: 'real-estate',
    label: 'Үл хөдлөх',
    emoji: '🏢',
    icon: 'Building2',
    color: '#0F766E',
    section: 'listing',
    entityTypes: ['STORE', 'REAL_ESTATE', 'AGENT'],
    aliases: ['real_estate', 'apartment', 'house', 'office', 'land', 'penthouse', 'property'],
    subcategories: [
      {
        name: 'Орон сууц',
        aliases: ['apartment'],
        children: [
          '1 өрөө',
          '2 өрөө',
          { name: '3 өрөө', children: ['Шинэ байр', 'Хуучин байр', 'Тавилгатай', 'Тавилгагүй'] },
          '4 өрөө',
          '5+ өрөө',
          'Студи',
        ],
      },
      { name: 'Хаус', aliases: ['house'], children: ['Таунхаус', 'Амины хаус', 'Зуслангийн хаус', 'Luxury house'] },
      { name: 'Оффис', aliases: ['office'], children: ['Оффис түрээс', 'Оффис худалдах', 'Co-working', 'Үйлчилгээний талбай'] },
      { name: 'Газар', aliases: ['land'], children: ['Өмчилсөн газар', 'Зуслангийн газар', 'Үйлдвэрийн газар', 'ХАА газар'] },
      { name: 'Пентхаус', aliases: ['penthouse'], children: ['Duplex', 'Luxury penthouse'] },
      'Агуулах',
      'Зуслан',
    ],
  },
  {
    key: 'new-buildings',
    label: 'Шинэ орон сууц & Төсөл',
    shortLabel: 'Шинэ төсөл',
    emoji: '🏗️',
    icon: 'Building2',
    color: '#EA580C',
    section: 'listing',
    entityTypes: ['STORE', 'CONSTRUCTION', 'COMPANY'],
    aliases: ['new_building', 'residential_project', 'commercial_project', 'mixed_use_project', 'construction-project'],
    subcategories: [
      { name: 'Шинэ орон сууц', aliases: ['new_building'], children: ['Ашиглалтад орсон', 'Барьж байгаа', 'Төлөвлөж байгаа', 'Урьдчилсан захиалга'] },
      { name: 'Орон сууцны төсөл', aliases: ['residential_project'], children: ['2 өрөө сонголт', '3 өрөө сонголт', '4 өрөө сонголт', 'Пентхаус сонголт'] },
      { name: 'Оффис / худалдааны төсөл', aliases: ['commercial_project'], children: ['Оффис', 'Үйлчилгээний талбай', 'Худалдааны төв'] },
      { name: 'Холимог зориулалттай төсөл', aliases: ['mixed_use_project'], children: ['Орон сууц + үйлчилгээ', 'Оффис + худалдаа'] },
    ],
  },
  {
    key: 'vehicles',
    label: 'Автомашин',
    shortLabel: 'Машин',
    emoji: '🚘',
    icon: 'Car',
    color: '#DC2626',
    section: 'listing',
    entityTypes: ['STORE', 'AUTO'],
    aliases: ['vehicle', 'vehicles', 'sedan', 'suv', 'truck', 'motorcycle'],
    subcategories: [
      {
        name: 'Toyota',
        aliases: ['toyota'],
        children: [
          { name: 'Land Cruiser', children: ['LC 300', 'LC 200', 'Prado', '70 Series'] },
          { name: 'Prius', children: ['Prius 20', 'Prius 30', 'Prius 40', 'Prius 50'] },
          'Harrier',
          'RAV4',
          'Camry',
          'Crown',
          'Hilux',
          'Aqua',
          'Alphard',
        ],
      },
      {
        name: 'Nissan',
        aliases: ['nissan'],
        children: ['Patrol', 'X-Trail', 'Leaf', 'Note', 'Teana', 'Juke', 'Serena'],
      },
      {
        name: 'Lexus',
        aliases: ['lexus'],
        children: ['LX', 'RX', 'NX', 'GX', 'ES', 'IS'],
      },
      {
        name: 'Mercedes-Benz',
        aliases: ['mercedes', 'benz'],
        children: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Class', 'Sprinter'],
      },
      {
        name: 'BMW',
        aliases: ['bmw'],
        children: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X6'],
      },
      {
        name: 'Hyundai',
        aliases: ['hyundai'],
        children: ['Sonata', 'Tucson', 'Santa Fe', 'Elantra', 'Porter', 'Starex'],
      },
      {
        name: 'Kia',
        aliases: ['kia'],
        children: ['K5', 'Sorento', 'Sportage', 'Carnival', 'Morning'],
      },
      {
        name: 'Honda',
        aliases: ['honda'],
        children: ['Fit', 'CR-V', 'Accord', 'Civic', 'Vezel'],
      },
      {
        name: 'Subaru',
        aliases: ['subaru'],
        children: ['Forester', 'Outback', 'Impreza', 'XV', 'Legacy'],
      },
      {
        name: 'Mitsubishi',
        aliases: ['mitsubishi'],
        children: ['Pajero', 'Outlander', 'Delica', 'L200', 'Eclipse Cross'],
      },
      { name: 'Tesla', aliases: ['tesla'], children: ['Model 3', 'Model Y', 'Model S', 'Model X'] },
      { name: 'Ачааны машин', aliases: ['truck'], children: ['Howo', 'Isuzu', 'Hino', 'Fuso', 'Volvo'] },
      { name: 'Мотоцикл', aliases: ['motorcycle'], children: ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki'] },
    ],
  },
  {
    key: 'jewelry',
    label: 'Гоёл чимэглэл',
    shortLabel: 'Гоёл',
    emoji: '💎',
    icon: 'Gem',
    color: '#9333EA',
    count: 1338,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    subcategories: ['Эмэгтэй зүүлт', 'Эрэгтэй зүүлт', 'Цаг', 'Нарны шил', 'Харааны шил рам'],
  },
  {
    key: 'kids-toys',
    label: 'Хүүхдийн',
    emoji: '🧸',
    icon: 'Baby',
    color: '#7C3AED',
    count: 1336,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['kids', 'baby'],
    subcategories: ['Гадуур хувцас', 'Гутал', 'Даашинз', 'Живх', 'Малгай', 'Тоглоом', 'Хүүхдийн өрөөний тавилга'],
  },
  {
    key: 'adult',
    label: '18+ Насанд хүрэгчдэд',
    shortLabel: '18+',
    emoji: '🔞',
    icon: 'Shield',
    color: '#BE123C',
    count: 1257,
    section: 'product',
    entityTypes: ['STORE'],
    subcategories: ['18+ хувцас', '18+ хэрэгсэл', 'Бэлгийн эрүүл мэнд', '18+ тавилга & эд зүйлс'],
  },
  {
    key: 'health-vitamins',
    label: 'Эрүүл мэнд & Витамин',
    shortLabel: 'Эрүүл мэнд',
    emoji: '💊',
    icon: 'HeartPulse',
    color: '#059669',
    count: 1115,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['health'],
    subcategories: ['Витамин', 'Эрүүл мэндийн хэрэгсэл', 'Асаргааны хэрэгсэл', 'Спорт нэмэлт бүтээгдэхүүн'],
  },
  {
    key: 'phones',
    label: 'Утас',
    emoji: '📱',
    icon: 'Smartphone',
    color: '#0891B2',
    count: 965,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['mobile', 'phone'],
    subcategories: [
      {
        name: 'Apple iPhone',
        aliases: ['iphone', 'apple'],
        children: [
          { name: 'iPhone 15', children: ['15', '15 Plus', '15 Pro', '15 Pro Max'] },
          { name: 'iPhone 14', children: ['14', '14 Plus', '14 Pro', '14 Pro Max'] },
          'iPhone 13',
          'iPhone 12',
          'iPhone 11',
          'iPhone SE',
        ],
      },
      {
        name: 'Samsung Galaxy',
        aliases: ['samsung'],
        children: [
          { name: 'Galaxy S', children: ['S24', 'S23', 'S22', 'S21'] },
          'Galaxy Note',
          'Galaxy Z Fold',
          'Galaxy Z Flip',
          'Galaxy A',
        ],
      },
      { name: 'Xiaomi / Redmi', aliases: ['xiaomi', 'redmi'], children: ['Xiaomi Mi', 'Redmi Note', 'Poco', 'Black Shark'] },
      { name: 'Huawei', aliases: ['huawei'], children: ['P series', 'Mate series', 'Nova series'] },
      { name: 'Google Pixel', aliases: ['pixel'], children: ['Pixel 8', 'Pixel 7', 'Pixel 6'] },
      { name: 'Гар утасны дагалдах хэрэгсэл', children: ['Кейс', 'Цэнэглэгч', 'Дэлгэц хамгаалагч', 'Power bank', 'Кабель'] },
      { name: 'Утасны дугаар', children: ['Дараалсан дугаар', 'Азын дугаар', 'VIP дугаар'] },
    ],
  },
  {
    key: 'technology',
    label: 'Технологи',
    emoji: '💻',
    icon: 'Laptop',
    color: '#0F766E',
    count: 807,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER', 'DIGITAL'],
    aliases: ['electronics', 'tech'],
    subcategories: [
      { name: 'Компьютер', children: ['Laptop', 'Desktop PC', 'MacBook', 'iMac', 'Workstation'] },
      { name: 'Компьютер аксессуар', children: ['Keyboard', 'Mouse', 'Monitor', 'Dock', 'Webcam'] },
      { name: 'Компьютерийн бүрэлдэхүүн', children: ['CPU', 'GPU', 'RAM', 'SSD/HDD', 'Motherboard', 'Power supply'] },
      { name: 'Чихэвч & Спикер', children: ['Bluetooth чихэвч', 'Gaming headset', 'Speaker', 'Soundbar'] },
      { name: 'Камер & Дрон', children: ['DSLR', 'Mirrorless', 'Action camera', 'Drone', 'Lens'] },
      'Проектор',
      { name: 'Видео тоглоом', children: ['PlayStation', 'Xbox', 'Nintendo', 'PC game'] },
    ],
  },
  {
    key: 'gifts-hobby',
    label: 'Бэлэг & Хобби',
    shortLabel: 'Бэлэг',
    emoji: '🎁',
    icon: 'Gift',
    color: '#E11D48',
    count: 795,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    subcategories: ['Бэлгийн сав', 'Тоглоом', 'Гар урлал', 'Коллекц', 'Хобби хэрэгсэл'],
  },
  {
    key: 'furniture',
    label: 'Тавилга',
    emoji: '🛋️',
    icon: 'Armchair',
    color: '#92400E',
    count: 777,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['sofa'],
    subcategories: ['Гэр ахуйн тавилга', 'Оффисын тавилга', 'Хүүхдийн өрөөний тавилга'],
  },
  {
    key: 'appliances',
    label: 'Цахилгаан бараа',
    shortLabel: 'Цахилгаан',
    emoji: '🔌',
    icon: 'Plug',
    color: '#475569',
    count: 738,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    subcategories: ['Гэр ахуйн цахилгаан бараа', 'Гал тогооны цахилгаан бараа', 'Электрон тамхи', 'Хаалганы цоож'],
  },
  {
    key: 'auto-parts',
    label: 'Авто сэлбэг туслах',
    shortLabel: 'Авто сэлбэг',
    emoji: '🚗',
    icon: 'Car',
    color: '#DC2626',
    count: 601,
    section: 'product',
    entityTypes: ['STORE', 'AUTO'],
    aliases: ['auto', 'auto-moto'],
    subcategories: [
      { name: 'Автомашины сэлбэг', children: ['Хөдөлгүүр', 'Кроп', 'Явах эд анги', 'Кузов', 'Гэрэл', 'Тормоз'] },
      { name: 'Дугуй & Обуд', children: ['Зуны дугуй', 'Өвлийн дугуй', 'Обуд', 'Дугуйн мэдрэгч'] },
      { name: 'Аккумулятор & Цахилгаан', children: ['Аккумулятор', 'Генератор', 'Стартер', 'Мэдрэгч'] },
      'Хүнд механизм сэлбэг',
      { name: 'Авто аксессуар', children: ['Суудлын бүрээс', 'Шалны дэвсгэр', 'Камер', 'Дуу хөгжим'] },
      'Ачаа, порхов, чиргүүл',
    ],
  },
  {
    key: 'books-stationery',
    label: 'Ном & Бичиг хэрэг',
    shortLabel: 'Ном',
    emoji: '📚',
    icon: 'BookOpen',
    color: '#4F46E5',
    count: 286,
    section: 'product',
    entityTypes: ['STORE', 'DIGITAL'],
    aliases: ['books-education'],
    subcategories: ['Ном', 'Сурах бичиг', 'Оффисын хэрэгсэл', 'Урлагийн хэрэгсэл'],
  },
  {
    key: 'construction-tools',
    label: 'Барилгын & тоног төхөөрөмж',
    shortLabel: 'Барилга',
    emoji: '🧰',
    icon: 'Construction',
    color: '#EA580C',
    count: 260,
    section: 'product',
    entityTypes: ['STORE', 'CONSTRUCTION'],
    aliases: ['construction'],
    subcategories: ['Барилгын материал', 'Багаж & тоног төхөөрөмж', 'Засал чимэглэл', 'Сантехник', 'ХАБЭ тоног хэрэгсэл'],
  },
  {
    key: 'travel',
    label: 'Аялал',
    emoji: '🏕️',
    icon: 'TentTree',
    color: '#16A34A',
    count: 241,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    subcategories: ['Аяллын хэрэгсэл', 'Аяллын цүнх', 'Лагерийн тоног', 'Майхан', 'Усны сав & Халуун сав'],
  },
  {
    key: 'sports',
    label: 'Спорт',
    emoji: '⚽',
    icon: 'Dumbbell',
    color: '#2563EB',
    count: 235,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['sports-travel'],
    subcategories: ['Фитнесс', 'Багийн спорт', 'Гадаа спорт', 'Спорт хувцас', 'Дасгалын хэрэгсэл'],
  },
  {
    key: 'food-beverage',
    label: 'Хүнс',
    emoji: '🍔',
    icon: 'UtensilsCrossed',
    color: '#059669',
    count: 126,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    aliases: ['food'],
    subcategories: ['Амттан', 'Амт оруулах бүтээгдэхүүн', 'Гурил будаа гоймон', 'Жимс & Жимсгэнэ', 'Мах & Далайн хүнс', 'Нарийн боов', 'Өндөг сүү цагаан идээ'],
  },
  {
    key: 'esports',
    label: 'E-Спорт',
    emoji: '🎮',
    icon: 'Gamepad2',
    color: '#7C3AED',
    count: 46,
    section: 'product',
    entityTypes: ['STORE', 'DIGITAL'],
    subcategories: ['Gaming тоног', 'Gaming аксессуар', 'Видео тоглоом', 'Streaming хэрэгсэл'],
  },
  {
    key: 'pets-plants',
    label: 'Мал амьтан & Ургамал',
    shortLabel: 'Амьтан ургамал',
    emoji: '🐾',
    icon: 'Dog',
    color: '#65A30D',
    count: 28,
    section: 'product',
    entityTypes: ['STORE', 'PRE_ORDER'],
    subcategories: ['Нохой', 'Муур хэрэгсэл', 'Тэжээвэр амьтны хоол', 'Ургамал', 'Хөрс бордоо'],
  },
  {
    key: 'digital-goods',
    label: 'Файл / Дижитал бараа',
    shortLabel: 'Дижитал',
    emoji: '💾',
    icon: 'Monitor',
    color: '#6D28D9',
    section: 'product',
    entityTypes: ['DIGITAL', 'STORE'],
    aliases: ['digital'],
    subcategories: ['PDF', 'ZIP', 'Видео', 'Instant download', 'Subscription', 'License key'],
  },
];

export const SERVICE_MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    key: 'education-training',
    label: 'Боловсрол & Спорт сургалт',
    shortLabel: 'Сургалт',
    emoji: '🎓',
    icon: 'GraduationCap',
    color: '#2563EB',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['tutoring'],
    subcategories: ['Ерөнхий боловсролын сургалт', 'Гадаад хэлний сургалт', 'Мэргэжлийн сургалт', 'Урлаг/авьяас хөгжүүлэлт', 'Спорт дасгалжуулалт'],
  },
  {
    key: 'beauty-services',
    label: 'Гоо сайхны үйлчилгээ',
    shortLabel: 'Гоо үйлчилгээ',
    emoji: '💅',
    icon: 'Scissors',
    color: '#DB2777',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['salon', 'beauty_service', 'haircut', 'coloring', 'nails', 'facial', 'massage'],
    subcategories: ['Үс засалт/арчилгаа', 'Нүүр арчилгаа', 'Нүүр будалт', 'Маникюр/педикюр', 'Сормуус/хөмсөг & Вакс', 'Биеийн арчилгаа & СПА'],
  },
  {
    key: 'tech-it-services',
    label: 'Технологи & IT үйлчилгээ',
    shortLabel: 'IT үйлчилгээ',
    emoji: '🧑‍💻',
    icon: 'Laptop',
    color: '#0891B2',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['web_dev', 'design-it'],
    subcategories: ['График дизайн & лого', 'Вэб/апп хөгжүүлэлт', 'Компьютер засвар/программ', 'Видео монтаж/анимейшн'],
  },
  {
    key: 'professional-consulting',
    label: 'Мэргэжлийн зөвлөх',
    shortLabel: 'Зөвлөх',
    emoji: '💼',
    icon: 'BriefcaseBusiness',
    color: '#4F46E5',
    section: 'service',
    entityTypes: ['SERVICE'],
    subcategories: ['Нягтлан бодох бүртгэл/татвар', 'Хуулийн зөвлөгөө', 'Маркетинг & Зар сурталчилгаа', 'Бизнес зөвлөгөө'],
  },
  {
    key: 'auto-services',
    label: 'Авто үйлчилгээ',
    emoji: '🚙',
    icon: 'Car',
    color: '#DC2626',
    section: 'service',
    entityTypes: ['SERVICE', 'AUTO'],
    subcategories: ['Авто засвар/оношлогоо', 'Дугуй засвар/солих', 'Машин угаалга', 'Түрээсийн машин'],
  },
  {
    key: 'repair-services',
    label: 'Засвар үйлчилгээ',
    shortLabel: 'Засвар',
    emoji: '🔧',
    icon: 'Wrench',
    color: '#EA580C',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['repair'],
    subcategories: ['Гэр ахуйн засвар', 'Цахилгаан засвар', 'Сантехник', 'Тоног төхөөрөмж засвар'],
  },
  {
    key: 'printing-services',
    label: 'Хэвлэх үйлчилгээ',
    shortLabel: 'Хэвлэл',
    emoji: '🖨️',
    icon: 'Printer',
    color: '#475569',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['printing'],
    subcategories: ['Нэрийн хуудас', 'Брошур', 'Стикер', 'Фото хэвлэл', 'Сав баглаа боодол'],
  },
  {
    key: 'manufacturing-custom',
    label: 'Үйлдвэр & Захиалгат',
    shortLabel: 'Захиалгат',
    emoji: '🏭',
    icon: 'Factory',
    color: '#7C2D12',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['factory'],
    subcategories: ['Захиалгат үйлдвэрлэл', 'Оёдол', 'Модон эдлэл', 'Металл хийц'],
  },
  {
    key: 'photo-video',
    label: 'Зураг авалт',
    emoji: '📷',
    icon: 'Camera',
    color: '#9333EA',
    section: 'service',
    entityTypes: ['SERVICE'],
    aliases: ['photo'],
    subcategories: ['Фото зураг', 'Видео бичлэг', 'Студи', 'Эвент зураг авалт'],
  },
  {
    key: 'design-creative',
    label: 'Дизайн & Бүтээл',
    shortLabel: 'Дизайн',
    emoji: '🎨',
    icon: 'Palette',
    color: '#C026D3',
    section: 'service',
    entityTypes: ['SERVICE', 'DIGITAL'],
    aliases: ['design'],
    subcategories: ['График дизайн', 'Брэндинг', 'Интерьер дизайн', 'Контент бүтээл'],
  },
];

export const MARKETPLACE_CATEGORIES = [
  ...PRODUCT_MARKETPLACE_CATEGORIES,
  ...SERVICE_MARKETPLACE_CATEGORIES,
];

const CATEGORY_ALIAS_MAP = new Map<string, string>(
  MARKETPLACE_CATEGORIES.flatMap((category) => [
    [category.key, category.key] as const,
    ...(category.aliases || []).map((alias) => [alias, category.key] as const),
    ...branchAliasPairs(category.key, category.subcategories),
  ]),
);

const CATEGORY_PATH_MAP = new Map<string, MarketplaceCategoryPath>(
  MARKETPLACE_CATEGORIES.flatMap((category) => {
    const rootPath = categoryPathEntry(category, category.key, []);
    return [
      [category.key, rootPath] as const,
      ...(category.aliases || []).map((alias) => [alias, rootPath] as const),
      ...branchPathPairs(category, category.subcategories),
    ];
  }),
);

const CATEGORY_DESCENDANT_VALUE_MAP = new Map<string, string[]>(
  MARKETPLACE_CATEGORIES.flatMap((category) =>
    branchDescendantValuePairs(category, category.subcategories)
  ),
);

const CATEGORY_CHILD_OPTION_MAP = new Map<string, MarketplaceCategoryOption[]>(
  MARKETPLACE_CATEGORIES.flatMap((category) => [
    [category.key, branchOptions(category.subcategories, category.key)] as const,
    ...branchChildOptionPairs(category.subcategories, category.key),
  ]),
);

export function normalizeMarketplaceCategory(value?: string | null): string {
  if (!value) return 'all';
  return CATEGORY_ALIAS_MAP.get(value) || value;
}

export function findMarketplaceCategory(value?: string | null): MarketplaceCategory | undefined {
  const normalized = normalizeMarketplaceCategory(value);
  return MARKETPLACE_CATEGORIES.find((category) => category.key === normalized);
}

export function categoryLabel(value?: string | null): string {
  return findMarketplaceCategory(value)?.label || value || 'Ангилалгүй';
}

export function categoryPathInfo(value?: string | null): MarketplaceCategoryPath | undefined {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) return undefined;
  return CATEGORY_PATH_MAP.get(key) || CATEGORY_PATH_MAP.get(normalizeMarketplaceCategory(key));
}

export function isMarketplaceCategoryValue(value?: string | null): boolean {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) return false;
  return CATEGORY_PATH_MAP.has(key) || CATEGORY_PATH_MAP.has(normalizeMarketplaceCategory(key));
}

export function categoryPathLabel(value?: string | null): string | undefined {
  return categoryPathInfo(value)?.label;
}

export function categoryDescendantValues(value?: string | null): string[] {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) return [];
  return Array.from(new Set(CATEGORY_DESCENDANT_VALUE_MAP.get(key) || [key]));
}

export function categoryChildOptions(value?: string | null): MarketplaceCategoryOption[] {
  const path = categoryPathInfo(value);
  const key = path?.value || normalizeMarketplaceCategory(value);
  return CATEGORY_CHILD_OPTION_MAP.get(key) || [];
}

export function categoryBranchLabel(branch: MarketplaceCategoryBranch): string {
  return typeof branch === 'string' ? branch : branch.name;
}

export function subcategoryNames(category: MarketplaceCategory, limit?: number): string[] {
  const names = category.subcategories.map(categoryBranchLabel);
  return typeof limit === 'number' ? names.slice(0, limit) : names;
}

export function subcategoryPreview(category: MarketplaceCategory, limit = 3): string {
  return subcategoryNames(category, limit).join(' · ');
}

export function descendantCategoryNames(category: MarketplaceCategory, limit?: number): string[] {
  const names = category.subcategories.flatMap(branchDescendantNames);
  return typeof limit === 'number' ? names.slice(0, limit) : names;
}

export function descendantCategoryPreview(category: MarketplaceCategory, limit = 12): string {
  return descendantCategoryNames(category, limit).join(' · ');
}

export function categoryTreeFallback(): CategoryTreeNode[] {
  return MARKETPLACE_CATEGORIES
    .map((category, index) => ({
      id: category.key,
      slug: category.key,
      name: category.label,
      nameEn: null,
      icon: category.emoji,
      level: 0,
      parentId: null,
      entityTypes: category.entityTypes,
      sortOrder: index,
      isActive: true,
      isApproved: true,
      isFeatured: index < 12,
      children: category.subcategories.map((branch, subIndex) =>
        branchToTreeNode(branch, category, category.key, category.key, 1, subIndex)
      ),
    }));
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  return tree.flatMap((node) => [node, ...flattenCategoryTree(node.children)]);
}

function slugifyCategoryName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-zа-яөөүё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function branchChildren(branch: MarketplaceCategoryBranch): MarketplaceCategoryBranch[] {
  return typeof branch === 'string' ? [] : branch.children || [];
}

function branchAliases(branch: MarketplaceCategoryBranch): string[] {
  return typeof branch === 'string' ? [] : branch.aliases || [];
}

function branchDescendantNames(branch: MarketplaceCategoryBranch): string[] {
  const children = branchChildren(branch);
  if (children.length === 0) return [categoryBranchLabel(branch)];
  return children.flatMap(branchDescendantNames);
}

function branchValue(parentSlug: string, branch: MarketplaceCategoryBranch, index: number): string {
  const name = categoryBranchLabel(branch);
  return `${parentSlug}-${slugifyCategoryName(name) || `item-${index + 1}`}`;
}

function branchOption(
  branch: MarketplaceCategoryBranch,
  parentSlug: string,
  index: number,
): MarketplaceCategoryOption {
  return {
    value: branchValue(parentSlug, branch, index),
    label: categoryBranchLabel(branch),
    hasChildren: branchChildren(branch).length > 0,
    aliases: branchAliases(branch),
  };
}

function branchOptions(
  branches: MarketplaceCategoryBranch[],
  parentSlug: string,
): MarketplaceCategoryOption[] {
  return branches.map((branch, index) => branchOption(branch, parentSlug, index));
}

function branchChildOptionPairs(
  branches: MarketplaceCategoryBranch[],
  parentSlug: string,
): Array<readonly [string, MarketplaceCategoryOption[]]> {
  return branches.flatMap((branch, index) => {
    const value = branchValue(parentSlug, branch, index);
    const children = branchChildren(branch);
    const childOptions = branchOptions(children, value);
    return [
      [value, childOptions] as const,
      ...branchAliases(branch).map((alias) => [alias, childOptions] as const),
      ...branchChildOptionPairs(children, value),
    ];
  });
}

function branchAliasPairs(
  rootKey: string,
  branches: MarketplaceCategoryBranch[],
  parentSlug = rootKey,
): Array<readonly [string, string]> {
  return branches.flatMap((branch, index) => {
    const slug = branchValue(parentSlug, branch, index);
    return [
      [`${parentSlug}-${index + 1}`, rootKey] as const,
      [slug, rootKey] as const,
      ...branchAliases(branch).map((alias) => [alias, rootKey] as const),
      ...branchAliasPairs(rootKey, branchChildren(branch), slug),
    ];
  });
}

function categoryPathEntry(
  category: MarketplaceCategory,
  value: string,
  branchLabels: string[],
  branchValues: string[] = [],
): MarketplaceCategoryPath {
  const labels = [category.label, ...branchLabels];
  return {
    rootKey: category.key,
    rootLabel: category.label,
    value,
    labels,
    label: labels.join(' / '),
    leafLabel: branchLabels[branchLabels.length - 1] || category.label,
    segments: [
      { value: category.key, label: category.label, isRoot: true },
      ...branchLabels.map((label, index) => ({
        value: branchValues[index] || value,
        label,
        isRoot: false,
      })),
    ],
  };
}

function branchPathPairs(
  category: MarketplaceCategory,
  branches: MarketplaceCategoryBranch[],
  parentSlug = category.key,
  parentLabels: string[] = [],
  parentValues: string[] = [],
): Array<readonly [string, MarketplaceCategoryPath]> {
  return branches.flatMap((branch, index) => {
    const name = categoryBranchLabel(branch);
    const slug = branchValue(parentSlug, branch, index);
    const labels = [...parentLabels, name];
    const values = [...parentValues, slug];
    const entry = categoryPathEntry(category, slug, labels, values);
    return [
      [`${parentSlug}-${index + 1}`, entry] as const,
      [slug, entry] as const,
      ...branchAliases(branch).map((alias) => [alias, entry] as const),
      ...branchPathPairs(category, branchChildren(branch), slug, labels, values),
    ];
  });
}

function branchDescendantValuePairs(
  category: MarketplaceCategory,
  branches: MarketplaceCategoryBranch[],
  parentSlug = category.key,
): Array<readonly [string, string[]]> {
  return branches.flatMap((branch, index) => {
    const slug = branchValue(parentSlug, branch, index);
    const directValues = [
      `${parentSlug}-${index + 1}`,
      slug,
      ...branchAliases(branch),
    ];
    const childPairs = branchDescendantValuePairs(category, branchChildren(branch), slug);
    const descendantValues = Array.from(new Set([
      ...directValues,
      ...childPairs.flatMap(([, values]) => values),
    ]));

    return [
      ...directValues.map((value) => [value, descendantValues] as const),
      ...childPairs,
    ];
  });
}

function branchToTreeNode(
  branch: MarketplaceCategoryBranch,
  category: MarketplaceCategory,
  parentId: string,
  parentSlug: string,
  level: number,
  sortOrder: number,
): CategoryTreeNode {
  const name = categoryBranchLabel(branch);
  const slug = branchValue(parentSlug, branch, sortOrder);

  return {
    id: slug,
    slug,
    name,
    nameEn: null,
    icon: null,
    level,
    parentId,
    entityTypes: category.entityTypes,
    sortOrder,
    isActive: true,
    isApproved: true,
    isFeatured: false,
    children: branchChildren(branch).map((child, childIndex) =>
      branchToTreeNode(child, category, slug, slug, level + 1, childIndex)
    ),
  };
}
