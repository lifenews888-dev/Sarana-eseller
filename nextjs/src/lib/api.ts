// ══════════════════════════════════════════════════════════════
// eseller.mn — API Client (TypeScript)
// Backend: https://sarana-backend.onrender.com/api
// ══════════════════════════════════════════════════════════════

const API_BASE = 'https://sarana-backend.onrender.com/api';
export const ACTIVE_STORE_ID_KEY = 'eseller_active_store_id';

export function getActiveStoreHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = includeJson ? { 'Content-Type': 'application/json' } : {};
  if (typeof window === 'undefined') return headers;

  const token = localStorage.getItem('token');
  const activeShopId = localStorage.getItem(ACTIVE_STORE_ID_KEY) || localStorage.getItem('eseller_shop_id');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (activeShopId) headers['x-eseller-shop-id'] = activeShopId;
  return headers;
}

export interface ApiError {
  status: number;
  message: string;
  data?: Record<string, unknown>;
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
  if (typeof window !== 'undefined') {
    const activeShopId = localStorage.getItem(ACTIVE_STORE_ID_KEY) || localStorage.getItem('eseller_shop_id');
    if (activeShopId) headers['x-eseller-shop-id'] = activeShopId;
  }

  const res = await fetch(API_BASE + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      message: data.message || 'Алдаа гарлаа',
      data,
    } as ApiError;
  }
  return data as T;
}

async function localApiFetch<T = Record<string, unknown>>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers = {
    ...getActiveStoreHeaders(true),
    ...(opts.headers as Record<string, string>),
  };
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      message: data.error || data.message || 'Алдаа гарлаа',
      data,
    } as ApiError;
  }
  return data as T;
}

// ══════ AUTH ══════
export interface User {
  _id: string;
  id?: string;
  shopId?: string | null;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'affiliate' | 'delivery' | 'admin';
  username?: string;
  entityType?: string;
  avatar?: string | null;
  store?: {
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const AuthAPI = {
  register: (name: string, email: string, password: string, role: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<User>('/auth/me'),
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

export const SellerProductsAPI = {
  list: () => localApiFetch<{ products: Product[] }>('/api/seller/products', { method: 'GET' }),
  create: (data: Partial<Product>) =>
    localApiFetch<Product>('/api/seller/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>) =>
    localApiFetch<Product>('/api/seller/products/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    localApiFetch('/api/seller/products/' + id, { method: 'DELETE' }),
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

export const SellerOrdersAPI = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return localApiFetch<{ orders: Order[] }>('/api/seller/orders' + (qs ? '?' + qs : ''));
  },
  updateStatus: (id: string, status: string) =>
    localApiFetch('/api/seller/orders/' + id + '/status', {
      method: 'PATCH',
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
