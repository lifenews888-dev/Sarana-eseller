// ══════════════════════════════════════════════════════════════
// eseller.mn — API Client (TypeScript)
// Default: same-origin Next.js /api (production eseller.mn)
// Optional override: NEXT_PUBLIC_API_BASE / EXPO-style env for previews
// ══════════════════════════════════════════════════════════════

const API_BASE = (
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : '/api'
).replace(/\/+$/, '');

export interface ApiError {
  status: number;
  message: string;
  data?: Record<string, unknown>;
}

/** Unwrap { success, data } envelopes used by Next auth routes. */
function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') return payload as T;
  const obj = payload as Record<string, unknown>;
  if (obj.success === true && 'data' in obj) return obj.data as T;
  return payload as T;
}

async function apiFetch<T = Record<string, unknown>>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${normalizedPath}`, {
    ...opts,
    headers,
    credentials: 'include',
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (typeof raw?.error === 'string' && raw.error) ||
      (typeof raw?.message === 'string' && raw.message) ||
      'Алдаа гарлаа';
    throw {
      status: res.status,
      message,
      data: raw,
    } as ApiError;
  }
  return unwrapEnvelope<T>(raw);
}

// ══════ AUTH ══════
export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'affiliate' | 'delivery' | 'admin' | 'superadmin' | string;
  username?: string;
  entityType?: string;
  avatar?: string | null;
  store?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  shops?: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    phone?: string | null;
    address?: string | null;
  }>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type LoginIdentifier = { email?: string; phone?: string };

export const AuthAPI = {
  register: (name: string, email: string, password: string, role: string, phone?: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, phone }),
    }),
  login: (identifier: string | LoginIdentifier, password: string) => {
    const body: Record<string, string> = { password };
    if (typeof identifier === 'string') {
      const trimmed = identifier.trim();
      if (/^\+?\d{8,}$/.test(trimmed.replace(/[\s-]/g, ''))) {
        body.phone = trimmed.replace(/[\s-]/g, '').replace(/^\+976/, '');
      } else {
        body.email = trimmed.toLowerCase();
      }
    } else {
      if (identifier.email) body.email = identifier.email.trim().toLowerCase();
      if (identifier.phone) body.phone = identifier.phone.trim();
    }
    return apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  me: async () => {
    const data = await apiFetch<{ user?: User } | User>('/auth/me');
    if (data && typeof data === 'object' && 'user' in data && data.user) {
      return data.user;
    }
    return data as User;
  },
};

// ══════ PRODUCTS ══════
export interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  salePrice?: number;
  description?: string;
  category?: string;
  emoji?: string;
  images?: string[];
  videoUrl?: string;
  stock?: number;
  deliveryFee?: number;
  estimatedMins?: number;
  commission?: number;
  rating?: number;
  reviewCount?: number;
  store?: { name: string };
  createdAt?: string;
  // Entity fields
  entityType?: string;
  area?: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  district?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  brand?: string;
  duration?: number;
  availableSlots?: number;
  totalUnits?: number;
  soldUnits?: number;
  completionDate?: string;
  pricePerSqm?: number;
  minBatch?: number;
  currentBatch?: number;
  advancePercent?: number;
  deliveryEstimate?: string;
  fileType?: string;
  fileSize?: string;
  downloadCount?: number;
  allowAffiliate?: boolean;
  affiliateCommission?: number;
}

export const ProductsAPI = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<{ products: Product[] }>('/products' + (qs ? '?' + qs : ''));
  },
  get: (id: string) => apiFetch<Product>('/products/' + id),
  create: (data: Partial<Product>) =>
    apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>) =>
    apiFetch<Product>('/products/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch('/products/' + id, { method: 'DELETE' }),
};

// ══════ ORDERS ══════
export interface OrderItem {
  product?: Product;
  name?: string;
  price?: number;
  quantity?: number;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  user?: { name: string };
  buyer?: { name: string };
  items?: OrderItem[];
  total?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  referral?: string;
  referralCode?: string;
  delivery?: {
    phone?: string;
    address?: { district?: string; street?: string; building?: string };
  };
  commissions?: { affiliate?: number };
  createdAt: string;
}

export const OrdersAPI = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<{ orders: Order[] }>('/orders' + (qs ? '?' + qs : ''));
  },
  create: (data: Record<string, unknown>) => {
    const ref = typeof window !== 'undefined'
      ? sessionStorage.getItem('eseller_ref') || localStorage.getItem('eseller_ref')
      : null;
    if (ref && !data.referralCode) data.referralCode = ref;
    return apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });
  },
  updateStatus: (id: string, status: string) =>
    apiFetch('/orders/' + id + '/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ══════ PAYMENT ══════
export const PaymentAPI = {
  createQPay: (data: Record<string, unknown>) =>
    apiFetch('/payment/qpay/create', { method: 'POST', body: JSON.stringify(data) }),
  checkQPay: (invoiceId: string) =>
    apiFetch('/payment/qpay/check/' + invoiceId),
};

// ══════ AFFILIATE ══════
export const AffiliateAPI = {
  getLinks: () => apiFetch('/affiliate/links'),
  getEarnings: () => apiFetch('/affiliate/earnings'),
  createLink: (productId: string) =>
    apiFetch('/affiliate/link', { method: 'POST', body: JSON.stringify({ productId }) }),
  trackClick: (linkId: string) =>
    apiFetch('/affiliate/click', { method: 'POST', body: JSON.stringify({ linkId }) }),
  getProfile: (username: string) => apiFetch('/affiliate/profile/' + username),
  updateProfile: (data: Record<string, unknown>) =>
    apiFetch('/affiliate/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ══════ WALLET ══════
export const WalletAPI = {
  get: () => apiFetch('/wallet'),
  withdraw: (amount: number, method: string) =>
    apiFetch('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount, method }) }),
};

// ══════ ADMIN ══════
export const AdminAPI = {
  getStats: () => apiFetch('/admin/stats'),
  getUsers: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/admin/users' + (qs ? '?' + qs : ''));
  },
  getCommission: () => apiFetch('/admin/commission'),
  updateCommission: (data: Record<string, unknown>) =>
    apiFetch('/admin/commission', { method: 'PUT', body: JSON.stringify(data) }),
  getCommissionCategories: () => apiFetch('/admin/commission/categories'),
  updateCommissionCategories: (data: Record<string, unknown>) =>
    apiFetch('/admin/commission/categories', { method: 'PUT', body: JSON.stringify(data) }),
};
