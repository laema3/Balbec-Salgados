import fs from 'fs';
import path from 'path';
import {
  User,
  Franchisee,
  Category,
  Product,
  ProductFranchiseePrice,
  Order,
  OrderItem,
  BusinessHours,
  SpecialDate,
  SystemSettings,
  BluefocusSyncLog,
  BluefocusQueueItem,
  AuditLog,
  AppNotification,
} from '../src/types.js';

interface DatabaseSchema {
  users: User[];
  franchisees: Franchisee[];
  categories: Category[];
  products: Product[];
  product_franchisee_prices: ProductFranchiseePrice[];
  orders: Order[];
  business_hours: BusinessHours[];
  special_dates: SpecialDate[];
  system_settings: SystemSettings;
  bluefocus_sync_logs: BluefocusSyncLog[];
  bluefocus_queue: BluefocusQueueItem[];
  audit_logs: AuditLog[];
  notifications: AppNotification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'balbec_database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();
  
  const categories: Category[] = [];
  const products: Product[] = [];
  const users: User[] = [
    { id: 'usr-admin', email: 'admin@balbec.com.br', name: 'Diretoria Comercial Balbec', role: 'admin', created_at: now },
  ];
  const franchisees: Franchisee[] = [];
  const product_franchisee_prices: ProductFranchiseePrice[] = [];

  // Business Hours (Segunda a Sábado com 2 turnos, Domingo fechado)
  const business_hours: BusinessHours[] = [
    { id: 'bh-0', day_of_week: 0, day_name: 'Domingo', enabled: false, shift1_start: '08:00', shift1_end: '12:00', shift2_enabled: false, shift2_start: '13:00', shift2_end: '17:00' },
    { id: 'bh-1', day_of_week: 1, day_name: 'Segunda-feira', enabled: true, shift1_start: '07:30', shift1_end: '12:00', shift2_enabled: true, shift2_start: '13:00', shift2_end: '19:00' },
    { id: 'bh-2', day_of_week: 2, day_name: 'Terça-feira', enabled: true, shift1_start: '07:30', shift1_end: '12:00', shift2_enabled: true, shift2_start: '13:00', shift2_end: '19:00' },
    { id: 'bh-3', day_of_week: 3, day_name: 'Quarta-feira', enabled: true, shift1_start: '07:30', shift1_end: '12:00', shift2_enabled: true, shift2_start: '13:00', shift2_end: '19:00' },
    { id: 'bh-4', day_of_week: 4, day_name: 'Quinta-feira', enabled: true, shift1_start: '07:30', shift1_end: '12:00', shift2_enabled: true, shift2_start: '13:00', shift2_end: '19:00' },
    { id: 'bh-5', day_of_week: 5, day_name: 'Sexta-feira', enabled: true, shift1_start: '07:30', shift1_end: '12:00', shift2_enabled: true, shift2_start: '13:00', shift2_end: '19:30' },
    { id: 'bh-6', day_of_week: 6, day_name: 'Sábado', enabled: true, shift1_start: '07:30', shift1_end: '14:00', shift2_enabled: false, shift2_start: '14:00', shift2_end: '18:00' },
  ];

  const special_dates: SpecialDate[] = [];

  const system_settings: SystemSettings = {
    id: 'sys-1',
    company_name: 'Balbec Salgados — Fábrica Matriz',
    logo_url: '/icon.svg',
    phone: '(11) 3322-8000',
    whatsapp: '(11) 98800-7700',
    email: 'pedidos@balbecsalgados.com.br',
    default_prep_minutes: 50,
    orders_enabled: true,
    enforce_commercial_rules: true,
    auto_block_franchisee: false,
    
    pix_key: 'financeiro@balbecsalgados.com.br',
    pix_recipient_name: 'BALBEC SALGADOS INDÚSTRIA E COMÉRCIO LTDA',
    pix_bank: 'Banco Itaú Unibanco (341) - Agência 0340 C/C 89201-4',
    pix_instructions: 'Efetue a transferência via chave PIX e apresente o comprovante na expedição no momento da retirada.',
    
    ntfy_url: 'https://ntfy.sh',
    ntfy_topic: 'balbec_pedidos_matriz',
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
    ai_system_prompt: 'Você é o assistente virtual inteligente da Balbec Salgados.',
    ai_enabled: true,
    ai_knowledge_base: 'Integração limpa pronta para receber dados da API Bluefocus.',
  };

  const orders: Order[] = [];
  const bluefocus_sync_logs: BluefocusSyncLog[] = [];
  const bluefocus_queue: BluefocusQueueItem[] = [];
  const audit_logs: AuditLog[] = [];
  const notifications: AppNotification[] = [];

  return {
    users,
    franchisees,
    categories,
    products,
    product_franchisee_prices,
    orders,
    business_hours,
    special_dates,
    system_settings,
    bluefocus_sync_logs,
    bluefocus_queue,
    audit_logs,
    notifications,
  };
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, loading initial seed:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // Users
  getUsers(): User[] { return this.data.users; }
  getUserById(id: string): User | undefined { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Franchisees
  getFranchisees(): Franchisee[] { return this.data.franchisees; }
  getFranchiseeById(id: string): Franchisee | undefined { return this.data.franchisees.find(f => f.id === id); }
  getFranchiseeByUserId(userId: string): Franchisee | undefined { return this.data.franchisees.find(f => f.user_id === userId); }
  createFranchisee(franchisee: Franchisee): Franchisee {
    this.data.franchisees.push(franchisee);
    this.save();
    return franchisee;
  }
  updateFranchisee(id: string, updates: Partial<Franchisee>): Franchisee | null {
    const idx = this.data.franchisees.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.franchisees[idx] = { ...this.data.franchisees[idx], ...updates, updated_at: new Date().toISOString() };
    this.save();
    return this.data.franchisees[idx];
  }
  deleteFranchisee(id: string): boolean {
    const idx = this.data.franchisees.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.data.franchisees.splice(idx, 1);
    this.save();
    return true;
  }

  // Categories
  getCategories(): Category[] { return this.data.categories.sort((a, b) => a.display_order - b.display_order); }
  getCategoryById(id: string): Category | undefined { return this.data.categories.find(c => c.id === id); }
  createCategory(category: Category): Category {
    this.data.categories.push(category);
    this.save();
    return category;
  }
  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.save();
    return this.data.categories[idx];
  }
  deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.categories.splice(idx, 1);
    this.save();
    return true;
  }

  // Products
  getProducts(): Product[] { return this.data.products.sort((a, b) => a.display_order - b.display_order); }
  getProductById(id: string): Product | undefined { return this.data.products.find(p => p.id === id); }
  createProduct(product: Product): Product {
    this.data.products.push(product);
    this.save();
    return product;
  }
  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.save();
    return this.data.products[idx];
  }
  deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  // Custom Franchisee Prices
  getFranchiseePrices(franchiseeId: string): ProductFranchiseePrice[] {
    return this.data.product_franchisee_prices.filter(pfp => pfp.franchisee_id === franchiseeId);
  }
  setFranchiseePrice(productId: string, franchiseeId: string, customPrice: number): ProductFranchiseePrice {
    const existing = this.data.product_franchisee_prices.find(
      pfp => pfp.product_id === productId && pfp.franchisee_id === franchiseeId
    );
    if (existing) {
      existing.custom_price = customPrice;
      this.save();
      return existing;
    }
    const newPrice: ProductFranchiseePrice = {
      id: `pfp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: productId,
      franchisee_id: franchiseeId,
      custom_price: customPrice,
    };
    this.data.product_franchisee_prices.push(newPrice);
    this.save();
    return newPrice;
  }
  removeFranchiseePrice(productId: string, franchiseeId: string): boolean {
    const idx = this.data.product_franchisee_prices.findIndex(
      pfp => pfp.product_id === productId && pfp.franchisee_id === franchiseeId
    );
    if (idx !== -1) {
      this.data.product_franchisee_prices.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Orders
  getOrders(): Order[] {
    return this.data.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  getOrderById(id: string): Order | undefined { return this.data.orders.find(o => o.id === id); }
  getOrdersByFranchisee(franchiseeId: string): Order[] {
    return this.data.orders
      .filter(o => o.franchisee_id === franchiseeId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }
  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates, updated_at: new Date().toISOString() };
    this.save();
    return this.data.orders[idx];
  }

  // Business Hours
  getBusinessHours(): BusinessHours[] { return this.data.business_hours; }
  updateBusinessHours(hours: BusinessHours[]): BusinessHours[] {
    this.data.business_hours = hours;
    this.save();
    return this.data.business_hours;
  }

  // Special Dates
  getSpecialDates(): SpecialDate[] { return this.data.special_dates; }
  createSpecialDate(sd: SpecialDate): SpecialDate {
    this.data.special_dates.push(sd);
    this.save();
    return sd;
  }
  deleteSpecialDate(id: string): boolean {
    const idx = this.data.special_dates.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.special_dates.splice(idx, 1);
    this.save();
    return true;
  }

  // System Settings
  getSystemSettings(): SystemSettings { return this.data.system_settings; }
  updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.system_settings = { ...this.data.system_settings, ...updates };
    this.save();
    return this.data.system_settings;
  }

  // Bluefocus Logs & Queue
  getBluefocusLogs(): BluefocusSyncLog[] {
    return this.data.bluefocus_sync_logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  createBluefocusLog(log: BluefocusSyncLog): BluefocusSyncLog {
    this.data.bluefocus_sync_logs.unshift(log);
    if (this.data.bluefocus_sync_logs.length > 200) {
      this.data.bluefocus_sync_logs.pop();
    }
    this.save();
    return log;
  }
  getBluefocusQueue(): BluefocusQueueItem[] { return this.data.bluefocus_queue; }
  addToBluefocusQueue(item: BluefocusQueueItem): BluefocusQueueItem {
    this.data.bluefocus_queue.push(item);
    this.save();
    return item;
  }
  updateBluefocusQueue(id: string, updates: Partial<BluefocusQueueItem>): BluefocusQueueItem | null {
    const idx = this.data.bluefocus_queue.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.data.bluefocus_queue[idx] = { ...this.data.bluefocus_queue[idx], ...updates };
    this.save();
    return this.data.bluefocus_queue[idx];
  }
  removeFromBluefocusQueue(id: string): boolean {
    const idx = this.data.bluefocus_queue.findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.data.bluefocus_queue.splice(idx, 1);
    this.save();
    return true;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.data.audit_logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  createAuditLog(log: AuditLog): AuditLog {
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
    return log;
  }

  // Notifications
  getNotifications(franchiseeId?: string): AppNotification[] {
    if (franchiseeId) {
      return this.data.notifications.filter(n => n.franchisee_id === franchiseeId);
    }
    return this.data.notifications;
  }
  createNotification(notif: AppNotification): AppNotification {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }
  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  // Reset/Re-seed
  resetToInitial() {
    this.data = getInitialData();
    this.save();
  }
}

export const db = new DatabaseStore();
