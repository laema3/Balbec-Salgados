import { Router } from 'express';
import { db } from './db.js';
import { orderService } from './services/orders.js';
import { bluefocusService } from './services/bluefocus.js';
import { ntfyService } from './services/ntfy.js';
import { Franchisee, User } from '../src/types.js';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// =========================================================================
// 1. AUTENTICAÇÃO E SESSÃO
// =========================================================================
apiRouter.post('/auth/login', (req, res) => {
  const { email, cnpj, password } = req.body;
  if (!email && !cnpj) {
    return res.status(400).json({ error: 'Informe o E-mail ou o CNPJ para entrar.' });
  }

  let user: User | undefined;
  if (email) {
    user = db.getUserByEmail(email);
  } else if (cnpj) {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const franchisee = db.getFranchisees().find(f => f.cnpj.replace(/\D/g, '') === cleanCnpj);
    if (franchisee) {
      user = db.getUserById(franchisee.user_id);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o CNPJ ou e-mail informado.' });
  }

  // Se for franqueado, obter dados do franqueado
  let franchisee: Franchisee | undefined;
  if (user.role === 'franchisee' && user.franchisee_id) {
    franchisee = db.getFranchiseeById(user.franchisee_id);
  }

  res.json({
    success: true,
    user,
    franchisee,
    token: `balbec_b2b_tok_${user.id}_${Date.now()}`,
  });
});

apiRouter.post('/auth/register', (req, res) => {
  const body = req.body;
  if (!body.email || !body.cnpj || !body.razao_social || !body.responsavel_nome) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes (E-mail, CNPJ, Razão Social, Responsável).' });
  }

  // Verificar se e-mail ou CNPJ já existem
  const existingUser = db.getUserByEmail(body.email);
  if (existingUser) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  const existingFranchisee = db.getFranchisees().find(f => f.cnpj.replace(/\D/g, '') === body.cnpj.replace(/\D/g, ''));
  if (existingFranchisee) {
    return res.status(400).json({ error: 'Já existe um cadastro com este CNPJ.' });
  }

  const userId = `usr-${Date.now()}`;
  const franchiseeId = `fran-${Date.now()}`;
  const nowIso = new Date().toISOString();

  const newUser: User = {
    id: userId,
    email: body.email,
    name: body.responsavel_nome,
    role: 'franchisee',
    franchisee_id: franchiseeId,
    created_at: nowIso,
  };

  const newFranchisee: Franchisee = {
    id: franchiseeId,
    user_id: userId,
    razao_social: body.razao_social,
    nome_fantasia: body.nome_fantasia || body.razao_social,
    cnpj: body.cnpj,
    inscricao_estadual: body.inscricao_estadual || '',
    responsavel_nome: body.responsavel_nome,
    responsavel_cpf: body.responsavel_cpf || '',
    telefone: body.telefone || '',
    whatsapp: body.whatsapp || body.telefone || '',
    email: body.email,
    logradouro: body.logradouro || '',
    numero: body.numero || '',
    complemento: body.complemento || '',
    bairro: body.bairro || '',
    cidade: body.cidade || '',
    estado: body.estado || 'SP',
    cep: body.cep || '',
    status: 'APROVADO', // Uso local sem confirmação prévia
    status_motivo: 'Aprovado automaticamente para uso local.',
    valor_minimo_compra: 500.00,
    percentual_desconto: 5,
    meta_mensal: 2500.00,
    periodo_meta: 'MENSAL',
    situacao_financeira: 'EM_ANALISE',
    created_at: nowIso,
    updated_at: nowIso,
    total_purchased_month: 0,
  };

  db.createUser(newUser);
  db.createFranchisee(newFranchisee);

  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: newFranchisee.responsavel_nome,
    user_role: 'franchisee',
    action: 'NOVO_CADASTRO_FRANQUEADO',
    target_entity: 'franchisees',
    target_id: newFranchisee.id,
    new_data: `CNPJ: ${newFranchisee.cnpj}, Razão: ${newFranchisee.razao_social}`,
    ip_address: req.ip,
    created_at: nowIso,
  });

  res.status(201).json({
    success: true,
    message: 'Seu cadastro foi recebido e está aguardando aprovação da Balbec Salgados.',
    user: newUser,
    franchisee: newFranchisee,
  });
});

// =========================================================================
// 2. FRANQUEADOS (ADMIN & PERFIL)
// =========================================================================
apiRouter.get('/franchisees', (req, res) => {
  const { status, search } = req.query;
  let list = db.getFranchisees();

  if (status && status !== 'TODOS') {
    list = list.filter(f => f.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(f =>
      f.razao_social.toLowerCase().includes(q) ||
      f.nome_fantasia.toLowerCase().includes(q) ||
      f.cnpj.includes(q) ||
      f.cidade.toLowerCase().includes(q) ||
      f.responsavel_nome.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

apiRouter.get('/franchisees/:id', (req, res) => {
  const f = db.getFranchiseeById(req.params.id);
  if (!f) return res.status(404).json({ error: 'Franqueado não encontrado.' });
  res.json(f);
});

apiRouter.put('/franchisees/:id', (req, res) => {
  const updated = db.updateFranchisee(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Franqueado não encontrado.' });

  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: req.body.admin_name || 'Administrador',
    user_role: 'admin',
    action: 'EDITAR_FRANQUEADO',
    target_entity: 'franchisees',
    target_id: req.params.id,
    new_data: JSON.stringify(req.body),
    ip_address: req.ip,
    created_at: new Date().toISOString(),
  });

  res.json(updated);
});

apiRouter.patch('/franchisees/:id/status', (req, res) => {
  const { status, motivo, admin_name } = req.body;
  const current = db.getFranchiseeById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Franqueado não encontrado.' });

  const updated = db.updateFranchisee(req.params.id, {
    status,
    status_motivo: motivo || undefined,
  });

  // Criar notificação para o franqueado
  let title = `Status Atualizado: ${status}`;
  let message = `O status do seu cadastro foi alterado para ${status}.`;
  if (status === 'APROVADO') {
    title = 'Cadastro Aprovado! Bem-vindo(a) à Balbec Salgados 🎉';
    message = 'Seu acesso ao catálogo e compras foi liberado com sucesso. Boas vendas!';
  } else if (status === 'BLOQUEADO') {
    title = 'Aviso de Bloqueio Comercial';
    message = motivo || 'Seu acesso para realização de pedidos está temporariamente bloqueado. Entre em contato com a Balbec Salgados.';
  }

  db.createNotification({
    id: `notif-${Date.now()}`,
    franchisee_id: req.params.id,
    title,
    message,
    read: false,
    type: 'APPROVAL',
    created_at: new Date().toISOString(),
  });

  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: admin_name || 'Administrador Balbec',
    user_role: 'admin',
    action: `ALTERAR_STATUS_${status}`,
    target_entity: 'franchisees',
    target_id: req.params.id,
    previous_data: `status: ${current.status}`,
    new_data: `status: ${status}`,
    reason: motivo,
    ip_address: req.ip,
    created_at: new Date().toISOString(),
  });

  res.json(updated);
});

apiRouter.delete('/franchisees/:id', (req, res) => {
  const current = db.getFranchiseeById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Franqueado não encontrado.' });

  db.deleteFranchisee(req.params.id);

  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: 'Administrador Balbec',
    user_role: 'admin',
    action: 'EXCLUIR_FRANQUEADO',
    target_entity: 'franchisees',
    target_id: req.params.id,
    previous_data: `Nome: ${current.nome_fantasia}, CNPJ: ${current.cnpj}`,
    ip_address: req.ip,
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Franqueado excluído com sucesso.' });
});

// =========================================================================
// 3. CATEGORIAS E PRODUTOS
// =========================================================================
apiRouter.get('/categories', (req, res) => {
  res.json(db.getCategories());
});

apiRouter.post('/categories', (req, res) => {
  const cat = db.createCategory({
    id: `cat-${Date.now()}`,
    name: req.body.name,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
    description: req.body.description || '',
    display_order: req.body.display_order || 99,
    active: req.body.active ?? true,
  });
  res.status(201).json(cat);
});

apiRouter.put('/categories/:id', (req, res) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Categoria não encontrada.' });
  res.json(updated);
});

apiRouter.delete('/categories/:id', (req, res) => {
  const ok = db.deleteCategory(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Categoria não encontrada.' });
  res.json({ success: true });
});

apiRouter.get('/products', (req, res) => {
  const { franchisee_id } = req.query;
  const products = db.getProducts();

  if (franchisee_id && typeof franchisee_id === 'string') {
    const customPrices = db.getFranchiseePrices(franchisee_id);
    const priceMap = new Map(customPrices.map(cp => [cp.product_id, cp.custom_price]));

    const mapped = products.map(p => ({
      ...p,
      custom_price: priceMap.get(p.id) ?? undefined,
    }));
    return res.json(mapped);
  }

  res.json(products);
});

apiRouter.post('/products', (req, res) => {
  const p = db.createProduct({
    id: `prod-${Date.now()}`,
    name: req.body.name,
    internal_code: req.body.internal_code || `BAL-${Math.floor(100 + Math.random() * 900)}`,
    sku: req.body.sku || `SKU-${Date.now().toString().slice(-4)}`,
    category_id: req.body.category_id,
    description: req.body.description || '',
    image_url: req.body.image_url || 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
    unit: req.body.unit || 'Cento (100 un)',
    weight_grams: req.body.weight_grams ? Number(req.body.weight_grams) : undefined,
    price: Number(req.body.price),
    promo_price: req.body.promo_price ? Number(req.body.promo_price) : undefined,
    stock: req.body.stock ? Number(req.body.stock) : 100,
    active: req.body.active ?? true,
    display_order: req.body.display_order ? Number(req.body.display_order) : 50,
  });

  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: req.body.admin_name || 'Administrador',
    user_role: 'admin',
    action: 'CRIAR_PRODUTO',
    target_entity: 'products',
    target_id: p.id,
    new_data: `Produto: ${p.name}, Preço: R$ ${p.price}`,
    created_at: new Date().toISOString(),
  });

  res.status(201).json(p);
});

apiRouter.put('/products/:id', (req, res) => {
  const current = db.getProductById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Produto não encontrado.' });

  const updated = db.updateProduct(req.params.id, req.body);
  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: req.body.admin_name || 'Administrador',
    user_role: 'admin',
    action: 'ATUALIZAR_PRODUTO',
    target_entity: 'products',
    target_id: req.params.id,
    previous_data: `Preço antigo: ${current.price}`,
    new_data: `Novo preço: ${updated?.price}`,
    created_at: new Date().toISOString(),
  });

  res.json(updated);
});

apiRouter.delete('/products/:id', (req, res) => {
  const current = db.getProductById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Produto não encontrado.' });

  db.deleteProduct(req.params.id);
  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: 'Administrador',
    user_role: 'admin',
    action: 'EXCLUIR_PRODUTO',
    target_entity: 'products',
    target_id: req.params.id,
    previous_data: `Produto: ${current.name}`,
    created_at: new Date().toISOString(),
  });

  res.json({ success: true });
});

// Preços por Franqueado
apiRouter.get('/products/:id/franchisee-prices', (req, res) => {
  const prices = db.getFranchiseePrices('').filter(pfp => pfp.product_id === req.params.id);
  res.json(prices);
});

apiRouter.post('/products/:id/franchisee-prices', (req, res) => {
  const { franchisee_id, custom_price } = req.body;
  if (!franchisee_id || custom_price === undefined) {
    return res.status(400).json({ error: 'Franqueado e preço são obrigatórios.' });
  }

  const pfp = db.setFranchiseePrice(req.params.id, franchisee_id, Number(custom_price));
  res.json(pfp);
});

apiRouter.delete('/products/:id/franchisee-prices/:franchiseeId', (req, res) => {
  const ok = db.removeFranchiseePrice(req.params.id, req.params.franchiseeId);
  res.json({ success: ok });
});

// =========================================================================
// 4. CARRINHO E PEDIDOS
// =========================================================================
apiRouter.post('/cart/evaluate', (req, res) => {
  try {
    const { franchisee_id, items } = req.body;
    if (!franchisee_id || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Dados do carrinho inválidos.' });
    }

    const evaluation = orderService.evaluateCart(franchisee_id, items);
    const storeStatus = orderService.isStoreOpen();

    res.json({
      ...evaluation,
      storeStatus,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/orders', (req, res) => {
  const { franchisee_id, status } = req.query;
  let orders = db.getOrders();

  if (franchisee_id && typeof franchisee_id === 'string') {
    orders = orders.filter(o => o.franchisee_id === franchisee_id);
  }

  if (status && status !== 'TODOS') {
    orders = orders.filter(o => o.status === status);
  }

  res.json(orders);
});

apiRouter.get('/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.json(order);
});

apiRouter.post('/orders', async (req, res) => {
  try {
    const { franchisee_id, items, payment_method, notes, idempotency_key } = req.body;
    if (!franchisee_id || !items || !payment_method) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios incompletos.' });
    }

    const result = await orderService.createOrder({
      franchisee_id,
      items,
      payment_method,
      notes,
      idempotency_key,
    }, req.ip);

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/orders/:id/status', (req, res) => {
  try {
    const { status, admin_name } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório.' });

    const updated = orderService.updateOrderStatus(req.params.id, status, admin_name || 'Administrador Balbec');
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/:id/manual-release', (req, res) => {
  try {
    const { reason, admin_name } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'O motivo da liberação manual é obrigatório.' });
    }

    const updated = orderService.manualReleaseOrder(
      req.params.id,
      admin_name || 'Diretoria Comercial',
      reason,
      req.ip
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/:id/repeat', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  // Retorna os itens formatados para preencher o carrinho com os preços ATUAIS
  const items = order.items.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
  }));

  res.json({
    franchisee_id: order.franchisee_id,
    items,
  });
});

// =========================================================================
// 5. HORÁRIOS DE ATENDIMENTO E DATAS ESPECIAIS
// =========================================================================
apiRouter.get('/store/status', (req, res) => {
  res.json(orderService.isStoreOpen());
});

apiRouter.get('/business-hours', (req, res) => {
  res.json(db.getBusinessHours());
});

apiRouter.put('/business-hours', (req, res) => {
  const hours = db.updateBusinessHours(req.body);
  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: 'Administrador',
    user_role: 'admin',
    action: 'ALTERAR_HORARIOS_ATENDIMENTO',
    target_entity: 'business_hours',
    target_id: 'all',
    created_at: new Date().toISOString(),
  });
  res.json(hours);
});

apiRouter.get('/special-dates', (req, res) => {
  res.json(db.getSpecialDates());
});

apiRouter.post('/special-dates', (req, res) => {
  const sd = db.createSpecialDate({
    id: `sd-${Date.now()}`,
    date: req.body.date,
    description: req.body.description,
    is_closed: req.body.is_closed ?? true,
    custom_hours: req.body.custom_hours,
  });
  res.status(201).json(sd);
});

apiRouter.delete('/special-dates/:id', (req, res) => {
  const ok = db.deleteSpecialDate(req.params.id);
  res.json({ success: ok });
});

// =========================================================================
// 6. CONFIGURAÇÕES GERAIS E INTEGRAÇÕES
// =========================================================================
apiRouter.get('/settings', (req, res) => {
  res.json(db.getSystemSettings());
});

apiRouter.put('/settings', (req, res) => {
  const updated = db.updateSystemSettings(req.body);
  db.createAuditLog({
    id: `aud-${Date.now()}`,
    user_name: 'Administrador',
    user_role: 'admin',
    action: 'ATUALIZAR_CONFIGURACOES_SISTEMA',
    target_entity: 'system_settings',
    target_id: updated.id,
    created_at: new Date().toISOString(),
  });
  res.json(updated);
});

// Bluefocus
apiRouter.post('/bluefocus/sync', async (req, res) => {
  const { type } = req.body;
  const log = await bluefocusService.sync(type || 'ALL');
  res.json(log);
});

apiRouter.get('/bluefocus/logs', (req, res) => {
  res.json(db.getBluefocusLogs());
});

apiRouter.get('/bluefocus/queue', (req, res) => {
  res.json(db.getBluefocusQueue());
});

apiRouter.post('/bluefocus/queue/:id/retry', async (req, res) => {
  const item = db.getBluefocusQueue().find(q => q.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item de fila não encontrado.' });

  const order = db.getOrderById(item.order_id);
  if (!order) return res.status(404).json({ error: 'Pedido associado não encontrado.' });

  const result = await bluefocusService.sendOrder(order);
  if (result.success) {
    db.removeFromBluefocusQueue(item.id);
    db.updateOrder(order.id, {
      bluefocus_id: result.bluefocus_id,
      bluefocus_status: 'SENT',
      bluefocus_sent_at: new Date().toISOString(),
    });
    return res.json({ success: true, message: 'Pedido sincronizado com sucesso com Bluefocus!' });
  } else {
    db.updateBluefocusQueue(item.id, {
      attempts: item.attempts + 1,
      last_error: result.error,
      next_retry_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    return res.status(500).json({ success: false, error: result.error });
  }
});

// NTFY Test
apiRouter.post('/ntfy/test', async (req, res) => {
  const result = await ntfyService.testNotification();
  res.json(result);
});

// Audit Logs
apiRouter.get('/audit-logs', (req, res) => {
  res.json(db.getAuditLogs());
});

// Notificações
apiRouter.get('/notifications', (req, res) => {
  const { franchisee_id } = req.query;
  res.json(db.getNotifications(franchisee_id as string));
});

apiRouter.patch('/notifications/:id/read', (req, res) => {
  const ok = db.markNotificationRead(req.params.id);
  res.json({ success: ok });
});

// Estatísticas Dashboard Admin
apiRouter.get('/stats/dashboard', (req, res) => {
  const orders = db.getOrders();
  const franchisees = db.getFranchisees();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const ordersToday = orders.filter(o => o.created_at.startsWith(todayStr));
  const ordersMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'CANCELADO';
  });

  const salesToday = ordersToday
    .filter(o => o.status !== 'CANCELADO')
    .reduce((acc, o) => acc + o.total, 0);

  const salesMonth = ordersMonth.reduce((acc, o) => acc + o.total, 0);

  const pendingApprovalFranchisees = franchisees.filter(f => f.status === 'PENDENTE').length;
  const activeFranchisees = franchisees.filter(f => f.status === 'APROVADO').length;
  const blockedFranchisees = franchisees.filter(f => f.status === 'BLOQUEADO').length;

  const ordersPrep = orders.filter(o => o.status === 'EM_PREPARACAO').length;
  const ordersReady = orders.filter(o => o.status === 'PRONTO_RETIRADA').length;
  const ordersPendingRelease = orders.filter(o => o.status === 'AGUARDANDO_LIBERACAO').length;
  const ordersPickedUp = orders.filter(o => o.status === 'RETIRADO').length;
  const ordersCanceled = orders.filter(o => o.status === 'CANCELADO').length;

  res.json({
    ordersTodayCount: ordersToday.length,
    ordersMonthCount: ordersMonth.length,
    salesToday,
    salesMonth,
    averageTicketMonth: ordersMonth.length > 0 ? Math.round((salesMonth / ordersMonth.length) * 100) / 100 : 0,
    activeFranchisees,
    blockedFranchisees,
    pendingApprovalFranchisees,
    ordersPrep,
    ordersReady,
    ordersPendingRelease,
    ordersPickedUp,
    ordersCanceled,
  });
});

// Relatórios
apiRouter.get('/reports', (req, res) => {
  const { start_date, end_date, franchisee_id, status } = req.query;
  let orders = db.getOrders();

  if (start_date && typeof start_date === 'string') {
    orders = orders.filter(o => o.created_at.slice(0, 10) >= start_date);
  }
  if (end_date && typeof end_date === 'string') {
    orders = orders.filter(o => o.created_at.slice(0, 10) <= end_date);
  }
  if (franchisee_id && typeof franchisee_id === 'string' && franchisee_id !== 'TODOS') {
    orders = orders.filter(o => o.franchisee_id === franchisee_id);
  }
  if (status && typeof status === 'string' && status !== 'TODOS') {
    orders = orders.filter(o => o.status === status);
  }

  const totalSold = orders.filter(o => o.status !== 'CANCELADO').reduce((acc, o) => acc + o.total, 0);
  const totalDiscounts = orders.filter(o => o.status !== 'CANCELADO').reduce((acc, o) => acc + o.discount_amount, 0);

  // Produtos mais vendidos
  const productCountMap = new Map<string, { name: string; qty: number; revenue: number }>();
  orders.filter(o => o.status !== 'CANCELADO').forEach(o => {
    o.items.forEach(item => {
      const cur = productCountMap.get(item.product_id) || { name: item.product_name, qty: 0, revenue: 0 };
      cur.qty += item.quantity;
      cur.revenue += item.subtotal;
      productCountMap.set(item.product_id, cur);
    });
  });

  const topProducts = Array.from(productCountMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

  res.json({
    ordersCount: orders.length,
    totalSold,
    totalDiscounts,
    topProducts,
    orders,
  });
});

// Resetar dados de demonstração
apiRouter.post('/db/reset', (req, res) => {
  db.resetToInitial();
  res.json({ success: true, message: 'Base de dados resetada para valores padrão de demonstração.' });
});

// Agente de I.A. Balbec
apiRouter.post('/ai/chat', async (req, res) => {
  try {
    const { message, franchisee_id, cart_items } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const settings = db.getSystemSettings();
    const apiKey = settings.ai_api_key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'Chave de API do Gemini não configurada. Defina no painel administrativo ou nas secrets do ambiente.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const franchisee = franchisee_id ? db.getFranchiseeById(franchisee_id) : null;
    const products = db.getProducts();
    const categories = db.getCategories();

    const systemPrompt = `Você é o "Balbec IA", o assistente virtual oficial de vendas e suporte B2B da ${settings.company_name}.
Dados da Empresa:
- Nome: ${settings.company_name}
- Telefone: ${settings.phone}
- WhatsApp do Admin: ${settings.whatsapp}
- Retirada expressa: Pedidos prontos em até ${settings.default_prep_minutes} minutos.

Instruções e Regras Personalizadas pelo Administrador:
${settings.ai_system_prompt || 'Seja prestativo, educado, sugira centos e combos mais vendidos, ajude o franqueado a atingir a meta mensal e a calcular descontos.'}

Base de Conhecimento / Ideias Adicionais cadastradas pelo Admin:
${settings.ai_knowledge_base || 'Nenhuma regra adicional.'}

Franqueado Atual: ${franchisee ? `${franchisee.nome_fantasia} (CNPJ: ${franchisee.cnpj}, Desconto: ${franchisee.percentual_desconto}%, Mínimo: R$ ${franchisee.valor_minimo_compra}, Meta Mensal: R$ ${franchisee.meta_mensal}, Compras no mês: R$ ${franchisee.total_purchased_month || 0}, Situação: ${franchisee.situacao_financeira})` : 'Visitante / Não identificado'}

Cardápio Atual Disponível (${products.length} produtos em ${categories.length} categorias):
${products.map(p => `- [ID: ${p.id}] ${p.name} | Unidade: ${p.unit} | Preço: R$ ${p.price.toFixed(2)}${p.promo_price ? ` (Promo: R$ ${p.promo_price.toFixed(2)})` : ''} | Estoque: ${p.stock || 100}`).join('\n')}

Se o franqueado quiser fechar um pedido ou enviar ao WhatsApp do administrador (${settings.whatsapp}), ajude-o a montar o resumo dos itens e gere um link formatado do WhatsApp (https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}?text=...). Responda sempre em português claro, profissional e acolhedor.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ success: true, reply: response.text });
  } catch (err: any) {
    console.error('Erro no agente de I.A.:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar mensagem com a I.A.' });
  }
});

apiRouter.post('/reset-clean', (req, res) => {
  db.resetToInitial();
  res.json({ success: true, message: 'Base limpa com sucesso. Todos os itens, categorias, clientes e pedidos foram zerados para a integração.' });
});

