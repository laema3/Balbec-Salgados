import {
  User,
  Franchisee,
  Category,
  Product,
  Order,
  BusinessHours,
  SpecialDate,
  SystemSettings,
  BluefocusSyncLog,
  BluefocusQueueItem,
  AuditLog,
  AppNotification,
} from '../types.js';

const API_BASE = '/api';

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}: Falha na requisição`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email: string) =>
    fetchJson<{ success: boolean; user: User; franchisee?: Franchisee; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  register: (payload: any) =>
    fetchJson<{ success: boolean; message: string; user: User; franchisee: Franchisee }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Franqueados
  getFranchisees: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return fetchJson<Franchisee[]>(`/franchisees?${params.toString()}`);
  },

  getFranchiseeById: (id: string) => fetchJson<Franchisee>(`/franchisees/${id}`),

  updateFranchisee: (id: string, data: Partial<Franchisee>) =>
    fetchJson<Franchisee>(`/franchisees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateFranchiseeStatus: (id: string, status: string, motivo?: string, admin_name?: string) =>
    fetchJson<Franchisee>(`/franchisees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, motivo, admin_name }),
    }),

  deleteFranchisee: (id: string) =>
    fetchJson<{ success: boolean }>(`/franchisees/${id}`, { method: 'DELETE' }),

  // Categorias & Produtos
  getCategories: () => fetchJson<Category[]>('/categories'),
  createCategory: (data: Partial<Category>) =>
    fetchJson<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) =>
    fetchJson<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    fetchJson<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),

  getProducts: (franchiseeId?: string) => {
    const query = franchiseeId ? `?franchisee_id=${franchiseeId}` : '';
    return fetchJson<Product[]>(`/products${query}`);
  },

  createProduct: (data: Partial<Product>) =>
    fetchJson<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<Product>) =>
    fetchJson<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProduct: (id: string) =>
    fetchJson<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  setFranchiseeProductPrice: (productId: string, franchiseeId: string, customPrice: number) =>
    fetchJson<{ id: string }>(`/products/${productId}/franchisee-prices`, {
      method: 'POST',
      body: JSON.stringify({ franchisee_id: franchiseeId, custom_price: customPrice }),
    }),

  // Carrinho & Pedidos
  evaluateCart: (franchiseeId: string, items: Array<{ product_id: string; quantity: number }>) =>
    fetchJson<{
      allowed: boolean;
      reason?: string;
      meetsMinimum: boolean;
      minimumRequired: number;
      franchisee: Franchisee;
      items: any[];
      subtotal: number;
      discountPercent: number;
      discountAmount: number;
      total: number;
      accumulatedMonth: number;
      metaMensal: number;
      metaRestante: number;
      metaPercentualAtingido: number;
      storeStatus: { isOpen: boolean; message?: string; nextOpening?: string };
    }>('/cart/evaluate', {
      method: 'POST',
      body: JSON.stringify({ franchisee_id: franchiseeId, items }),
    }),

  getOrders: (franchiseeId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (franchiseeId) params.set('franchisee_id', franchiseeId);
    if (status) params.set('status', status);
    return fetchJson<Order[]>(`/orders?${params.toString()}`);
  },

  getOrderById: (id: string) => fetchJson<Order>(`/orders/${id}`),

  createOrder: (payload: {
    franchisee_id: string;
    items: Array<{ product_id: string; quantity: number }>;
    payment_method: 'DINHEIRO' | 'PIX';
    notes?: string;
    idempotency_key?: string;
  }) =>
    fetchJson<{ order: Order; warning?: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOrderStatus: (orderId: string, status: string, admin_name?: string) =>
    fetchJson<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_name }),
    }),

  manualReleaseOrder: (orderId: string, reason: string, admin_name?: string) =>
    fetchJson<Order>(`/orders/${orderId}/manual-release`, {
      method: 'POST',
      body: JSON.stringify({ reason, admin_name }),
    }),

  repeatOrder: (orderId: string) =>
    fetchJson<{ franchisee_id: string; items: Array<{ product_id: string; quantity: number }> }>(
      `/orders/${orderId}/repeat`,
      { method: 'POST' }
    ),

  // Horários & Loja
  getStoreStatus: () => fetchJson<{ isOpen: boolean; message?: string; nextOpening?: string }>('/store/status'),
  getBusinessHours: () => fetchJson<BusinessHours[]>('/business-hours'),
  updateBusinessHours: (hours: BusinessHours[]) =>
    fetchJson<BusinessHours[]>('/business-hours', { method: 'PUT', body: JSON.stringify(hours) }),
  getSpecialDates: () => fetchJson<SpecialDate[]>('/special-dates'),
  createSpecialDate: (data: Partial<SpecialDate>) =>
    fetchJson<SpecialDate>('/special-dates', { method: 'POST', body: JSON.stringify(data) }),
  deleteSpecialDate: (id: string) =>
    fetchJson<{ success: boolean }>(`/special-dates/${id}`, { method: 'DELETE' }),

  // Configurações
  getSettings: () => fetchJson<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) =>
    fetchJson<SystemSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Bluefocus
  syncBluefocus: (type: string = 'ALL') =>
    fetchJson<BluefocusSyncLog>('/bluefocus/sync', { method: 'POST', body: JSON.stringify({ type }) }),
  getBluefocusLogs: () => fetchJson<BluefocusSyncLog[]>('/bluefocus/logs'),
  getBluefocusQueue: () => fetchJson<BluefocusQueueItem[]>('/bluefocus/queue'),
  retryBluefocusQueueItem: (id: string) =>
    fetchJson<{ success: boolean; message?: string }>(`/bluefocus/queue/${id}/retry`, { method: 'POST' }),

  // NTFY
  testNtfy: () => fetchJson<{ success: boolean; message: string }>('/ntfy/test', { method: 'POST' }),

  // Auditoria, Notificações & Stats
  getAuditLogs: () => fetchJson<AuditLog[]>('/audit-logs'),
  getNotifications: (franchiseeId?: string) => {
    const query = franchiseeId ? `?franchisee_id=${franchiseeId}` : '';
    return fetchJson<AppNotification[]>(`/notifications${query}`);
  },
  markNotificationRead: (id: string) =>
    fetchJson<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  getDashboardStats: () =>
    fetchJson<{
      ordersTodayCount: number;
      ordersMonthCount: number;
      salesToday: number;
      salesMonth: number;
      averageTicketMonth: number;
      activeFranchisees: number;
      blockedFranchisees: number;
      pendingApprovalFranchisees: number;
      ordersPrep: number;
      ordersReady: number;
      ordersPendingRelease: number;
      ordersPickedUp: number;
      ordersCanceled: number;
    }>('/stats/dashboard'),

  getReports: (filters: { start_date?: string; end_date?: string; franchisee_id?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);
    if (filters.franchisee_id) params.set('franchisee_id', filters.franchisee_id);
    if (filters.status) params.set('status', filters.status);
    return fetchJson<{
      ordersCount: number;
      totalSold: number;
      totalDiscounts: number;
      topProducts: Array<{ name: string; qty: number; revenue: number }>;
      orders: Order[];
    }>(`/reports?${params.toString()}`);
  },

  resetDatabase: () => fetchJson<{ success: boolean; message: string }>('/db/reset', { method: 'POST' }),
};
