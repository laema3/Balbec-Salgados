// Shared TypeScript interfaces for Balbec Salgados - Portal do Franqueado

export type UserRole = 'admin' | 'franchisee';
export type FranchiseeStatus = 'PENDENTE' | 'APROVADO' | 'BLOQUEADO' | 'INATIVO' | 'SUSPENSO';
export type OrderStatus =
  | 'AGUARDANDO_CONFIRMACAO'
  | 'RECEBIDO'
  | 'EM_PREPARACAO'
  | 'PRONTO_RETIRADA'
  | 'RETIRADO'
  | 'CANCELADO'
  | 'BLOQUEADO'
  | 'AGUARDANDO_LIBERACAO';

export type PaymentMethod = 'DINHEIRO' | 'PIX';
export type SyncStatus = 'SUCCESS' | 'ERROR' | 'PENDING';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  franchisee_id?: string;
  created_at: string;
}

export interface Franchisee {
  id: string;
  user_id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  status: FranchiseeStatus;
  status_motivo?: string;
  
  // Regras Comerciais Individuais
  valor_minimo_compra: number; // e.g. 500.00
  percentual_desconto: number; // e.g. 10 (%)
  meta_mensal: number; // e.g. 2000.00
  periodo_meta: 'MENSAL' | 'QUINZENAL';
  condicao_comercial?: string;
  permissao_especial?: boolean;
  situacao_financeira: 'REGULAR' | 'PENDENCIA' | 'EM_ANALISE';
  
  created_at: string;
  updated_at: string;
  last_purchase_at?: string;
  total_purchased_month?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  internal_code: string;
  sku: string;
  category_id: string;
  description: string;
  image_url: string;
  unit: string; // 'Cento', 'Unidade', 'Kg', 'Pacote 50 un'
  weight_grams?: number;
  price: number;
  promo_price?: number;
  stock?: number;
  active: boolean;
  display_order: number;
  custom_price?: number; // Preço específico para o franqueado atual, se houver
  // Campos da documentação Bluefocus Cloud (Produtos, Fotos, Descrições e Preços)
  bluefocus_produto_id?: string;
  descricao_resumida?: string;
  descricao_detalhada?: string;
  familia_id?: string;
  familia_desc?: string;
  fotos?: string[]; // URLs de fotos adicionais (-A.jpg, -B.jpg, etc.)
}

export interface ProductFranchiseePrice {
  id: string;
  product_id: string;
  franchisee_id: string;
  custom_price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string; // e.g. 'BAL-20260921-0001'
  franchisee_id: string;
  franchisee_name?: string;
  franchisee_cnpj?: string;
  franchisee_phone?: string;
  
  items: OrderItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  
  pickup_location: string; // Sempre 'Balbec Salgados - Unidade Fabril'
  prep_time_minutes: number; // Padrão: 50
  
  received_at?: string;
  ready_estimate_at?: string;
  picked_up_at?: string;
  
  responsible_admin?: string;
  notes?: string;
  
  // Liberação Manual
  manual_released: boolean;
  motivo_liberacao_manual?: string;
  manual_released_by?: string;
  manual_released_at?: string;
  
  idempotency_key?: string;
  
  // Bluefocus & NTFY
  bluefocus_id?: string;
  bluefocus_status: 'NOT_SENT' | 'PENDING' | 'SENT' | 'ERROR';
  bluefocus_attempts: number;
  bluefocus_error?: string;
  bluefocus_sent_at?: string;
  
  ntfy_status: 'PENDING' | 'SENT' | 'FAILED';
  
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: string;
  day_of_week: number; // 0=Domingo, 1=Segunda, etc.
  day_name: string;
  enabled: boolean;
  shift1_start: string; // '08:00'
  shift1_end: string;   // '12:00'
  shift2_enabled: boolean;
  shift2_start: string; // '13:00'
  shift2_end: string;   // '18:00'
}

export interface SpecialDate {
  id: string;
  date: string; // 'YYYY-MM-DD'
  description: string;
  is_closed: boolean;
  custom_hours?: string;
}

export interface SystemSettings {
  id: string;
  company_name: string;
  logo_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  
  // Pedidos
  default_prep_minutes: number;
  orders_enabled: boolean;
  enforce_commercial_rules: boolean;
  auto_block_franchisee: boolean;
  
  // Pagamento PIX
  pix_key: string;
  pix_recipient_name: string;
  pix_bank: string;
  pix_instructions: string;
  
  // NTFY
  ntfy_url: string;
  ntfy_topic: string;
  ntfy_token: string;
  ntfy_enabled: boolean;
  
  // Bluefocus
  bluefocus_api_url: string;
  bluefocus_api_key: string;
  bluefocus_token: string;
  bluefocus_auth_number: string;
  bluefocus_empresa_id: string;
  bluefocus_usuario_id: string;
  bluefocus_pdv_codigo: string;
  bluefocus_sync_type: string; // 'CARGA_TOTAL' | 'CARGA_PARCIAL'
  bluefocus_tipo_dado: string;
  bluefocus_data_inicial: string;
  bluefocus_carga_numero: string;
  bluefocus_carga_sequencia: string;
  bluefocus_produto_inicial: string;
  bluefocus_sync_frequency: string; // '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | 'daily'
  bluefocus_auto_sync: boolean;
  last_bluefocus_sync?: string;
  last_bluefocus_status?: 'SUCCESS' | 'ERROR';
  
  // PWA
  pwa_title: string;
  pwa_description: string;

  // Agente de I.A. Balbec
  ai_api_key?: string;
  ai_system_prompt?: string;
  ai_enabled: boolean;
  ai_knowledge_base?: string;
}

export interface BluefocusSyncLog {
  id: string;
  sync_type: 'ALL' | 'PRODUCTS' | 'PRICES' | 'CUSTOMERS' | 'ORDERS' | 'STOCK';
  records_count: number;
  status: SyncStatus;
  message: string;
  execution_time_ms: number;
  created_at: string;
  details?: string;
}

export interface BluefocusQueueItem {
  id: string;
  order_id: string;
  order_number: string;
  attempts: number;
  last_error?: string;
  next_retry_at: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  target_entity: string;
  target_id: string;
  previous_data?: string;
  new_data?: string;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  franchisee_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'ORDER' | 'SYSTEM' | 'COMMERCIAL' | 'APPROVAL';
  order_id?: string;
  created_at: string;
}
