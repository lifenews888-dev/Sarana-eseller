/**
 * Зарын булангийн ангилал тус бүрийн нарийн шүүлтүүр (unegui.mn-тэй дүйцэхүйц).
 * URL параметр: m_<key>=утга  (жишээ: ?category=vehicles&m_brand=Toyota&m_yearMin=2015)
 * Утгууд FeedItem.metadata дотор хадгалагдсан (тоон талбар нь number).
 */

export type FilterDef =
  | { key: string; label: string; kind: 'facet'; field: string } // брэнд — тоотой жагсаалт
  | { key: string; label: string; kind: 'select'; field: string; options: string[] }
  | { key: string; label: string; kind: 'min' | 'max'; field: string; placeholder?: string }
  | { key: string; label: string; kind: 'contains'; field: string; placeholder?: string };

export const LISTING_FILTERS: Record<string, FilterDef[]> = {
  vehicles: [
    { key: 'brand', label: 'Үйлдвэрлэгч', kind: 'facet', field: 'brand' },
    { key: 'model', label: 'Загвар', kind: 'contains', field: 'model', placeholder: 'Prius, Land Cruiser...' },
    { key: 'yearMin', label: 'Он (доод)', kind: 'min', field: 'year', placeholder: '2015' },
    { key: 'yearMax', label: 'Он (дээд)', kind: 'max', field: 'year', placeholder: '2025' },
    { key: 'mileageMax', label: 'Гүйлт (дээд), км', kind: 'max', field: 'mileage', placeholder: '150000' },
    { key: 'fuelType', label: 'Түлш', kind: 'select', field: 'fuelType', options: ['Бензин', 'Дизель', 'Хайбрид', 'Цахилгаан', 'Газ'] },
    { key: 'transmission', label: 'Хурдны хайрцаг', kind: 'select', field: 'transmission', options: ['Автомат', 'Механик', 'CVT'] },
    { key: 'drivetrain', label: 'Хөтлөгч', kind: 'select', field: 'drivetrain', options: ['4WD', 'AWD', 'FWD', 'RWD'] },
    { key: 'registrationStatus', label: 'Дугаар', kind: 'select', field: 'registrationStatus', options: ['Монголд бүртгэлтэй', 'Дугаар аваагүй', 'Импортын бичигтэй'] },
  ],
  'real-estate': [
    { key: 'listingType', label: 'Зарын төрөл', kind: 'select', field: 'listingType', options: ['Худалдах', 'Түрээслэх', 'Бартер', 'Урьдчилсан захиалга'] },
    { key: 'propertyType', label: 'Төрөл', kind: 'select', field: 'propertyType', options: ['Орон сууц', 'Хаус', 'Оффис', 'Газар', 'Агуулах', 'Зуслан'] },
    { key: 'roomsMin', label: 'Өрөө (доод)', kind: 'min', field: 'rooms', placeholder: '2' },
    { key: 'roomsMax', label: 'Өрөө (дээд)', kind: 'max', field: 'rooms', placeholder: '4' },
    { key: 'sqmMin', label: 'Талбай м² (доод)', kind: 'min', field: 'sqm', placeholder: '40' },
    { key: 'sqmMax', label: 'Талбай м² (дээд)', kind: 'max', field: 'sqm', placeholder: '120' },
    { key: 'condition', label: 'Засвар', kind: 'select', field: 'condition', options: ['Шинэ засвар', 'Евро засвар', 'Энгийн', 'Засвар хэрэгтэй'] },
    { key: 'furnishing', label: 'Тавилга', kind: 'select', field: 'furnishing', options: ['Бүрэн тавилгатай', 'Хагас тавилгатай', 'Тавилгагүй'] },
  ],
  phones: [
    { key: 'brand', label: 'Брэнд', kind: 'facet', field: 'brand' },
    { key: 'model', label: 'Загвар', kind: 'contains', field: 'model', placeholder: 'iPhone 15...' },
    { key: 'storage', label: 'Багтаамж', kind: 'select', field: 'storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
    { key: 'condition', label: 'Төлөв', kind: 'select', field: 'condition', options: ['Шинэ', 'Бараг шинэ', 'Хэрэглэсэн', 'Сэвтэй'] },
  ],
};

export function filtersForCategory(root?: string | null): FilterDef[] {
  return (root && LISTING_FILTERS[root]) || [];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** URL параметрүүдээс MongoDB filter үүсгэнэ. Шүүлтүүр байхгүй бол null. */
export function buildMetadataMongoFilter(root: string | null | undefined, sp: URLSearchParams): Record<string, unknown> | null {
  const defs = filtersForCategory(root);
  if (defs.length === 0) return null;
  const and: Record<string, unknown>[] = [];

  for (const def of defs) {
    const raw = (sp.get(`m_${def.key}`) || '').trim();
    if (!raw) continue;
    const path = `metadata.${def.field}`;
    if (def.kind === 'min' || def.kind === 'max') {
      const n = Number(raw.replace(/[,\s]/g, ''));
      if (!Number.isFinite(n)) continue;
      and.push({ [path]: { [def.kind === 'min' ? '$gte' : '$lte']: n } });
    } else if (def.kind === 'contains') {
      and.push({ [path]: { $regex: escapeRegex(raw.slice(0, 60)), $options: 'i' } });
    } else {
      // facet / select — том жижиг үсэг үл хамааран яг таарах
      and.push({ [path]: { $regex: `^${escapeRegex(raw.slice(0, 60))}$`, $options: 'i' } });
    }
  }
  return and.length ? { $and: and } : null;
}
