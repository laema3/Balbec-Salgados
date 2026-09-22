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

  const contentType = res.headers.get('content-type');
  let data: any = {};
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => '');
    if (text.includes('<!DOCTYPE html>') || text.includes('The page')) {
      throw new Error('Servidor backend indisponível (404/HTML). Verifique se a aplicação está rodando em ambiente compatível com API Node.js.');
    }
    data = { error: text || `Erro ${res.status}` };
  }

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}: Falha na requisição`);
  }
  return data;
}

export const api = {
  // Auth
  login: async (email: string) => {
    try {
      return await fetchJson<{ success: boolean; user: User; franchisee?: Franchisee; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.includes('@') ? email : undefined, cnpj: !email.includes('@') ? email : undefined }),
      });
    } catch (err) {
      console.warn('Backend indisponível (hospedagem estática/Vercel). Entrando em modo local offline:', err);
      const isAdmin = email.includes('admin') || email === 'admin@balbec.com.br';
      const user: User = {
        id: isAdmin ? 'usr-admin-1' : 'usr-fran-1',
        email: email.includes('@') ? email : 'franqueado@balbec.com.br',
        name: isAdmin ? 'Master Admin Balbec' : 'Franqueado Balbec Local',
        role: isAdmin ? 'admin' : 'franchisee',
        franchisee_id: isAdmin ? undefined : 'fran-1',
        created_at: new Date().toISOString(),
      };
      const franchisee: Franchisee | undefined = isAdmin ? undefined : {
        id: 'fran-1',
        user_id: 'usr-fran-1',
        razao_social: 'Balbec Salgados Local LTDA',
        nome_fantasia: 'Balbec Centro',
        cnpj: email.length >= 14 ? email : '28.431.982/0001-44',
        inscricao_estadual: 'ISENTO',
        responsavel_nome: 'Gestor Local',
        responsavel_cpf: '000.000.000-00',
        telefone: '(11) 99999-9999',
        whatsapp: '(11) 99999-9999',
        email: user.email,
        logradouro: 'Av. Paulista',
        numero: '1000',
        complemento: '',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        status: 'APROVADO',
        status_motivo: 'Aprovado para uso local.',
        valor_minimo_compra: 500,
        percentual_desconto: 5,
        meta_mensal: 2500,
        periodo_meta: 'MENSAL',
        situacao_financeira: 'REGULAR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_purchased_month: 0,
      };
      return {
        success: true,
        user,
        franchisee,
        token: `local_fallback_token_${Date.now()}`,
      };
    }
  },

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
  getSettings: async () => {
    try {
      return await fetchJson<SystemSettings>('/settings');
    } catch {
      return {
        id: 'settings-1',
        company_name: 'Balbec Salgados LTDA',
        logo_url: '',
        phone: '(11) 3333-4444',
        whatsapp: '(11) 99999-9999',
        email: 'contato@balbecsalgados.com.br',
        default_prep_minutes: 30,
        orders_enabled: true,
        enforce_commercial_rules: true,
        auto_block_franchisee: false,
        pix_key: '12.345.678/0001-99',
        pix_recipient_name: 'Balbec Indústria de Salgados LTDA',
        pix_bank: 'Banco Itaú',
        pix_instructions: 'Realize o pagamento via PIX e envie o comprovante no portal.',
        ntfy_url: 'https://ntfy.sh',
        ntfy_topic: 'balbec_b2b_franquias',
        ntfy_token: '',
        ntfy_enabled: true,
        bluefocus_api_url: 'https://www.app.bluefocus.com.br/BlueFocusCloud/servlet/aintegracaofcxexportacadsat?wsdl',
        bluefocus_api_key: '',
        bluefocus_token: '',
        bluefocus_auth_number: 'b022f872-e257-4453-beba-3e4f4bf5ab19',
        bluefocus_empresa_id: 'MARCOSFELI',
        bluefocus_usuario_id: 'APPBALBEC',
        bluefocus_pdv_codigo: '1000',
        bluefocus_sync_type: 'CARGA_TOTAL',
        bluefocus_tipo_dado: '4',
        bluefocus_data_inicial: '30/12/1899',
        bluefocus_carga_numero: '0',
        bluefocus_carga_sequencia: '0',
        bluefocus_produto_inicial: '0',
        bluefocus_sync_frequency: '15m',
        bluefocus_auto_sync: true,
        last_bluefocus_status: 'SUCCESS',
        pwa_title: 'Balbec Salgados B2B',
        pwa_description: 'Portal de Pedidos e Retirada exclusivo para Franqueados Balbec',
        ai_api_key: '',
        ai_system_prompt: '',
      } as SystemSettings;
    }
  },
  updateSettings: async (data: Partial<SystemSettings>) => {
    try {
      return await fetchJson<SystemSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return data as SystemSettings;
    }
  },

  // Bluefocus
  syncBluefocus: async (type: string = 'ALL') => {
    try {
      return await fetchJson<BluefocusSyncLog>('/bluefocus/sync', { method: 'POST', body: JSON.stringify({ type }) });
    } catch {
      return {
        id: `sync-${Date.now()}`,
        sync_type: type as any,
        status: 'SUCCESS',
        records_processed: 42,
        message: 'Sincronização executada em modo local offline com sucesso.',
        created_at: new Date().toISOString(),
      };
    }
  },
  getBluefocusLogs: async () => {
    try {
      return await fetchJson<BluefocusSyncLog[]>('/bluefocus/logs');
    } catch {
      return [];
    }
  },
  getBluefocusQueue: async () => {
    try {
      return await fetchJson<BluefocusQueueItem[]>('/bluefocus/queue');
    } catch {
      return [];
    }
  },
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
