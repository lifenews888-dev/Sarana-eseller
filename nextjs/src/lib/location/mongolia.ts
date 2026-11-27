import { haversineDistance } from './userLocation';
/**
 * Mongolia locations — UB 9 districts + 21 provinces
 */

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export const MONGOLIA_LOCATIONS = {
  ub: {
    name: 'Улаанбаатар',
    lat: 47.9184,
    lng: 106.9177,
    districts: {
      'khan-uul':          { name: 'Хан-Уул',          lat: 47.8864, lng: 106.9057 },
      'sukhbaatar':        { name: 'Сүхбаатар',         lat: 47.9138, lng: 106.9220 },
      'bayangol':          { name: 'Баянгол',            lat: 47.9057, lng: 106.8832 },
      'bayanzurkh':        { name: 'Баянзүрх',           lat: 47.9284, lng: 107.0127 },
      'chingeltei':        { name: 'Чингэлтэй',          lat: 47.9289, lng: 106.9377 },
      'songinokhairkhan':  { name: 'Сонгинохайрхан',     lat: 47.8964, lng: 106.7747 },
      'nalaikh':           { name: 'Налайх',             lat: 47.7568, lng: 107.3140 },
      'baganuur':          { name: 'Багануур',            lat: 47.7102, lng: 108.2793 },
      'bagakhangai':       { name: 'Багахангай',          lat: 47.6368, lng: 106.9690 },
    } as Record<string, LocationPoint>,
  },
  provinces: {
    'arkhangai':    { name: 'Архангай',      lat: 47.8974, lng: 101.1942 },
    'bayan-olgii':  { name: 'Баян-Өлгий',   lat: 48.9978, lng: 89.9632  },
    'bayankhongor': { name: 'Баянхонгор',    lat: 46.1944, lng: 100.7181 },
    'bulgan':       { name: 'Булган',        lat: 48.8147, lng: 103.5343 },
    'gobi-altai':   { name: 'Говь-Алтай',   lat: 45.7531, lng: 96.2846  },
    'dornogovi':    { name: 'Дорноговь',     lat: 44.5858, lng: 110.4082 },
    'dornod':       { name: 'Дорнод',        lat: 47.7733, lng: 118.9592 },
    'dundgovi':     { name: 'Дундговь',      lat: 45.5792, lng: 106.9766 },
    'zavkhan':      { name: 'Завхан',        lat: 48.6651, lng: 96.8707  },
    'orkhon':       { name: 'Орхон',         lat: 49.0272, lng: 104.0467 },
    'uvurkhangai':  { name: 'Өвөрхангай',    lat: 46.0136, lng: 102.7823 },
    'umnugovi':     { name: 'Өмнөговь',      lat: 43.5667, lng: 104.4167 },
    'sukhbaatar-p': { name: 'Сүхбаатар',     lat: 46.9069, lng: 113.5300 },
    'selenge':      { name: 'Сэлэнгэ',       lat: 49.6396, lng: 106.3258 },
    'tuv':          { name: 'Төв',           lat: 47.5311, lng: 105.6266 },
    'uvs':          { name: 'Увс',           lat: 49.9841, lng: 92.0661  },
    'khovd':        { name: 'Ховд',          lat: 48.0131, lng: 91.6425  },
    'khuvsgul':     { name: 'Хөвсгөл',       lat: 49.6375, lng: 100.1599 },
    'khentii':      { name: 'Хэнтий',        lat: 47.3123, lng: 110.6516 },
    'darkhan-uul':  { name: 'Дархан-Уул',    lat: 49.4878, lng: 105.9477 },
    'govi-sumber':  { name: 'Говьсүмбэр',    lat: 46.4767, lng: 108.5654 },
  } as Record<string, LocationPoint>,
};

/** Get all locations as flat list for search/picker */
export function getAllLocations(): { key: string; name: string; type: 'district' | 'province'; lat: number; lng: number }[] {
  const list: { key: string; name: string; type: 'district' | 'province'; lat: number; lng: number }[] = [];

  for (const [key, d] of Object.entries(MONGOLIA_LOCATIONS.ub.districts)) {
    list.push({ key, name: `${d.name} (УБ)`, type: 'district', lat: d.lat, lng: d.lng });
  }

  for (const [key, p] of Object.entries(MONGOLIA_LOCATIONS.provinces)) {
    list.push({ key, name: p.name, type: 'province', lat: p.lat, lng: p.lng });
  }

  return list;
}

/** Find nearest location from coordinates */
export function findNearestLocation(lat: number, lng: number): { key: string; name: string; type: string; distance: number } {
  const all = getAllLocations();
  let nearest = { key: '', name: '', type: '', distance: Infinity };

  for (const loc of all) {
    const dist = haversineDistance({ lat, lng }, { lat: loc.lat, lng: loc.lng });
    if (dist < nearest.distance) {
      nearest = { key: loc.key, name: loc.name, type: loc.type, distance: dist };
    }
  }

  return nearest;
}
