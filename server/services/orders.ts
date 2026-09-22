import { Order, OrderItem, PaymentMethod, OrderStatus } from '../../src/types.js';
import { db } from '../db.js';
import { bluefocusService } from './bluefocus.js';
import { ntfyService } from './ntfy.js';

export interface CreateOrderInput {
  franchisee_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  payment_method: PaymentMethod;
  notes?: string;
  idempotency_key?: string;
}

export class OrderService {
  /**
   * Verifica se a fábrica Balbec está aberta no momento atual
   */
  isStoreOpen(): { isOpen: boolean; message?: string; nextOpening?: string } {
    const settings = db.getSystemSettings();
    if (!settings.orders_enabled) {
      return { isOpen: false, message: 'O recebimento de pedidos está temporariamente desativado pela administração.' };
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Checar datas especiais / feriados
    const specialDates = db.getSpecialDates();
    const holiday = specialDates.find(sd => sd.date === todayStr);
    if (holiday && holiday.is_closed) {
      return {
        isOpen: false,
        message: `Fábrica fechada hoje devido ao feriado/data especial: ${holiday.description}.`,
        nextOpening: 'Retornaremos no próximo dia útil às 07:30.',
      };
    }

    // Checar horário comercial do dia da semana
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda...
    const businessHours = db.getBusinessHours();
    const todayHours = businessHours.find(bh => bh.day_of_week === dayOfWeek);

    if (!todayHours || !todayHours.enabled) {
      return {
        isOpen: false,
        message: `Não há expediente aos ${todayHours?.day_name || 'dias atuais'}.`,
        nextOpening: 'Voltaremos na segunda-feira às 07:30.',
      };
    }

    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Turno 1
    const inShift1 = currentHourMin >= todayHours.shift1_start && currentHourMin <= todayHours.shift1_end;
    
    // Turno 2 (opcional)
    let inShift2 = false;
    if (todayHours.shift2_enabled && todayHours.shift2_start && todayHours.shift2_end) {
      inShift2 = currentHourMin >= todayHours.shift2_start && currentHourMin <= todayHours.shift2_end;
    }

    if (!inShift1 && !inShift2) {
      let nextOpening = '';
      if (currentHourMin < todayHours.shift1_start) {
        nextOpening = `Abertura hoje às ${todayHours.shift1_start}.`;
      } else if (todayHours.shift2_enabled && currentHourMin < todayHours.shift2_start) {
        nextOpening = `Intervalo de produção. Retornamos hoje às ${todayHours.shift2_start}.`;
      } else {
        nextOpening = 'Expediente encerrado hoje. Voltaremos amanhã às 07:30.';
      }

      return {
        isOpen: false,
        message: `Estamos fora do horário de atendimento. (${todayHours.shift1_start}-${todayHours.shift1_end}${todayHours.shift2_enabled ? ` e ${todayHours.shift2_start}-${todayHours.shift2_end}` : ''})`,
        nextOpening,
      };
    }

    return { isOpen: true };
  }

  /**
   * Valida regras comerciais e recalcula valores garantindo integridade server-side
   */
  evaluateCart(franchiseeId: string, itemsInput: Array<{ product_id: string; quantity: number }>) {
    const franchisee = db.getFranchiseeById(franchiseeId);
    if (!franchisee) {
      throw new Error('Franqueado não encontrado.');
    }

    if (franchisee.status !== 'APROVADO') {
      let reason = 'Seu cadastro está pendente de aprovação pela Balbec Salgados.';
      if (franchisee.status === 'BLOQUEADO') {
        reason = 'Seu acesso para realização de pedidos está temporariamente bloqueado. Entre em contato com a Balbec Salgados.';
      } else if (franchisee.status === 'INATIVO' || franchisee.status === 'SUSPENSO') {
        reason = `Sua conta encontra-se ${franchisee.status.toLowerCase()}. Contate o suporte comercial Balbec.`;
      }
      return {
        allowed: false,
        reason,
        franchisee,
        items: [],
        subtotal: 0,
        discountPercent: 0,
        discountAmount: 0,
        total: 0,
      };
    }

    const allProducts = db.getProducts();
    const customPrices = db.getFranchiseePrices(franchiseeId);
    const customPriceMap = new Map(customPrices.map(cp => [cp.product_id, cp.custom_price]));

    const processedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const input of itemsInput) {
      if (input.quantity <= 0) continue;
      const product = allProducts.find(p => p.id === input.product_id);
      if (!product || !product.active) continue;

      // Preço específico do franqueado tem prioridade absoluta
      let unitPrice = product.promo_price ?? product.price;
      if (customPriceMap.has(product.id)) {
        unitPrice = customPriceMap.get(product.id)!;
      }

      const itemSubtotal = Math.round(unitPrice * input.quantity * 100) / 100;
      subtotal += itemSubtotal;

      processedItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_id: '',
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        unit: product.unit,
        unit_price: unitPrice,
        quantity: input.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Regras de Desconto Comercial
    const discountPercent = franchisee.percentual_desconto || 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
    const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    // Avaliação de Regra de Valor Mínimo
    const minRequired = franchisee.valor_minimo_compra || 0;
    const meetsMinimum = subtotal >= minRequired;

    // Cálculo da Meta Mensal Acumulada
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const completedOrders = db.getOrdersByFranchisee(franchiseeId).filter(o => {
      const oDate = new Date(o.created_at);
      return oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear && o.status !== 'CANCELADO';
    });
    const accumulatedMonth = completedOrders.reduce((acc, o) => acc + o.total, 0);
    const metaRestante = Math.max(0, (franchisee.meta_mensal || 0) - accumulatedMonth);
    const metaPercentualAtingido = franchisee.meta_mensal > 0
      ? Math.min(100, Math.round((accumulatedMonth / franchisee.meta_mensal) * 100))
      : 100;

    return {
      allowed: true,
      meetsMinimum,
      minimumRequired: minRequired,
      franchisee,
      items: processedItems,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      accumulatedMonth,
      metaMensal: franchisee.meta_mensal || 0,
      metaRestante,
      metaPercentualAtingido,
    };
  }

  /**
   * Criação oficial do Pedido com controle de regras, idempotência e tempo de preparo
   */
  async createOrder(input: CreateOrderInput, ipAddress?: string): Promise<{ order: Order; warning?: string }> {
    const settings = db.getSystemSettings();

    // Idempotência
    if (input.idempotency_key) {
      const existing = db.getOrders().find(o => o.idempotency_key === input.idempotency_key);
      if (existing) {
        console.log(`[OrderService] Pedido com chave de idempotência ${input.idempotency_key} já existe.`);
        return { order: existing };
      }
    }

    // Horário de funcionamento
    const openCheck = this.isStoreOpen();
    if (!openCheck.isOpen) {
      throw new Error(openCheck.message || 'Fábrica fechada no momento.');
    }

    // Avaliar carrinho e regras comerciais no backend
    const evalResult = this.evaluateCart(input.franchisee_id, input.items);
    if (!evalResult.allowed) {
      throw new Error(evalResult.reason);
    }
    if (evalResult.items.length === 0) {
      throw new Error('O carrinho está vazio ou os produtos selecionados não estão ativos.');
    }

    const franchisee = evalResult.franchisee;
    const now = new Date();
    const nowIso = now.toISOString();

    // Gerar número de pedido padronizado: BAL-YYYYMMDD-XXXX
    const datePrefix = nowIso.slice(0, 10).replace(/-/g, '');
    const todaysOrdersCount = db.getOrders().filter(o => o.created_at.startsWith(nowIso.slice(0, 10))).length + 1;
    const orderNumber = `BAL-${datePrefix}-${String(todaysOrdersCount).padStart(4, '0')}`;

    const prepMinutes = settings.default_prep_minutes || 50;

    // Determina o status inicial com base nas regras comerciais
    let initialStatus: OrderStatus = 'RECEBIDO';
    let warning: string | undefined = undefined;

    if (settings.enforce_commercial_rules && !evalResult.meetsMinimum) {
      // Regra comercial não atingida: o pedido fica aguardando liberação manual da diretoria
      initialStatus = 'AGUARDANDO_LIBERACAO';
      const minVal = evalResult.minimumRequired ?? 0;
      warning = `O valor do pedido (R$ ${evalResult.subtotal.toFixed(2)}) não atingiu a compra mínima cadastrada (R$ ${minVal.toFixed(2)}). O pedido foi registrado e está aguardando liberação manual da diretoria Balbec.`;
    }

    const receivedAt = initialStatus === 'RECEBIDO' ? nowIso : undefined;
    const readyEstimateAt = initialStatus === 'RECEBIDO'
      ? new Date(now.getTime() + prepMinutes * 60 * 1000).toISOString()
      : undefined;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      franchisee_id: franchisee.id,
      franchisee_name: franchisee.nome_fantasia || franchisee.razao_social,
      franchisee_cnpj: franchisee.cnpj,
      franchisee_phone: franchisee.whatsapp || franchisee.telefone,
      items: evalResult.items,
      subtotal: evalResult.subtotal,
      discount_percent: evalResult.discountPercent,
      discount_amount: evalResult.discountAmount,
      total: evalResult.total,
      payment_method: input.payment_method,
      status: initialStatus,
      pickup_location: 'Balbec Salgados — Unidade Fabril (Retirada no Balcão de Expedição)',
      prep_time_minutes: prepMinutes,
      received_at: receivedAt,
      ready_estimate_at: readyEstimateAt,
      notes: input.notes,
      manual_released: false,
      idempotency_key: input.idempotency_key,
      bluefocus_status: 'NOT_SENT',
      bluefocus_attempts: 0,
      ntfy_status: 'PENDING',
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 1. Salvar localmente com integridade garantida
    db.createOrder(newOrder);

    // 2. Criar log de auditoria
    db.createAuditLog({
      id: `aud-${Date.now()}`,
      user_name: franchisee.responsavel_nome,
      user_role: 'franchisee',
      action: 'CRIAR_PEDIDO',
      target_entity: 'orders',
      target_id: newOrder.id,
      new_data: `Pedido ${newOrder.order_number}, Total: R$ ${newOrder.total.toFixed(2)}, Status: ${newOrder.status}`,
      ip_address: ipAddress,
      created_at: nowIso,
    });

    // 3. Atualizar total de compras do mês do franqueado
    db.updateFranchisee(franchisee.id, {
      total_purchased_month: (franchisee.total_purchased_month || 0) + newOrder.total,
      last_purchase_at: nowIso,
    });

    // 4. Integrações assíncronas (nunca falham o pedido do cliente)
    this.processIntegrationsAsync(newOrder);

    return { order: newOrder, warning };
  }

  /**
   * Processa Bluefocus e NTFY em segundo plano
   */
  private async processIntegrationsAsync(order: Order) {
    // NTFY
    ntfyService.notifyNewOrder(order)
      .then(success => {
        db.updateOrder(order.id, { ntfy_status: success ? 'SENT' : 'FAILED' });
      })
      .catch(() => {
        db.updateOrder(order.id, { ntfy_status: 'FAILED' });
      });

    // Bluefocus
    if (order.status !== 'AGUARDANDO_LIBERACAO' && order.status !== 'BLOQUEADO') {
      bluefocusService.sendOrder(order)
        .then(result => {
          if (result.success) {
            db.updateOrder(order.id, {
              bluefocus_id: result.bluefocus_id,
              bluefocus_status: 'SENT',
              bluefocus_sent_at: new Date().toISOString(),
              bluefocus_attempts: 1,
            });
          } else {
            db.updateOrder(order.id, {
              bluefocus_status: 'ERROR',
              bluefocus_error: result.error,
              bluefocus_attempts: 1,
            });
            // Adicionar à fila de retry
            db.addToBluefocusQueue({
              id: `bfq-${Date.now()}`,
              order_id: order.id,
              order_number: order.order_number,
              attempts: 1,
              last_error: result.error,
              next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              status: 'PENDING',
              created_at: new Date().toISOString(),
            });
          }
        })
        .catch(err => {
          db.updateOrder(order.id, {
            bluefocus_status: 'ERROR',
            bluefocus_error: err.message,
            bluefocus_attempts: 1,
          });
        });
    }
  }

  /**
   * Liberação Manual de Pedido pela Administração
   */
  manualReleaseOrder(orderId: string, adminName: string, reason: string, ipAddress?: string): Order {
    const order = db.getOrderById(orderId);
    if (!order) throw new Error('Pedido não encontrado.');

    if (order.status !== 'AGUARDANDO_LIBERACAO' && order.status !== 'BLOQUEADO') {
      throw new Error(`Este pedido já se encontra no status ${order.status} e não requer liberação.`);
    }

    const settings = db.getSystemSettings();
    const now = new Date();
    const prepMinutes = order.prep_time_minutes || settings.default_prep_minutes || 50;

    const updated = db.updateOrder(orderId, {
      status: 'RECEBIDO',
      manual_released: true,
      motivo_liberacao_manual: reason,
      manual_released_by: adminName,
      manual_released_at: now.toISOString(),
      received_at: now.toISOString(),
      ready_estimate_at: new Date(now.getTime() + prepMinutes * 60 * 1000).toISOString(),
    });

    if (!updated) throw new Error('Falha ao atualizar pedido.');

    // Notificar franqueado
    db.createNotification({
      id: `notif-${Date.now()}`,
      franchisee_id: order.franchisee_id,
      title: 'Pedido Liberado pela Balbec! 🎉',
      message: `Seu pedido ${order.order_number} foi liberado pela diretoria e entrou na fila de preparo.`,
      read: false,
      type: 'ORDER',
      order_id: order.id,
      created_at: now.toISOString(),
    });

    // Registrar auditoria
    db.createAuditLog({
      id: `aud-${Date.now()}`,
      user_name: adminName,
      user_role: 'admin',
      action: 'LIBERAR_PEDIDO_MANUAL',
      target_entity: 'orders',
      target_id: orderId,
      previous_data: `status: ${order.status}`,
      new_data: 'status: RECEBIDO, manual_released: true',
      reason,
      ip_address: ipAddress,
      created_at: now.toISOString(),
    });

    // Disparar envio ao Bluefocus e NTFY
    this.processIntegrationsAsync(updated);

    return updated;
  }

  /**
   * Alteração de status com cronômetros e regras
   */
  updateOrderStatus(orderId: string, newStatus: OrderStatus, adminName: string): Order {
    const order = db.getOrderById(orderId);
    if (!order) throw new Error('Pedido não encontrado.');

    const nowIso = new Date().toISOString();
    const updates: Partial<Order> = {
      status: newStatus,
      responsible_admin: adminName,
    };

    if (newStatus === 'RECEBIDO' && !order.received_at) {
      const prepMinutes = order.prep_time_minutes || 50;
      updates.received_at = nowIso;
      updates.ready_estimate_at = new Date(Date.now() + prepMinutes * 60 * 1000).toISOString();
    } else if (newStatus === 'RETIRADO') {
      updates.picked_up_at = nowIso;
    }

    const updated = db.updateOrder(orderId, updates);
    if (!updated) throw new Error('Falha ao atualizar status.');

    // Notificar franqueado sobre a mudança
    let notifTitle = 'Atualização do Pedido';
    let notifMsg = `O status do pedido ${order.order_number} mudou para ${newStatus}.`;

    if (newStatus === 'EM_PREPARACAO') {
      notifTitle = 'Pedido em Preparação 🍳';
      notifMsg = `Seus salgados do pedido ${order.order_number} estão sendo preparados na fábrica!`;
    } else if (newStatus === 'PRONTO_RETIRADA') {
      notifTitle = 'SEU PEDIDO ESTÁ PRONTO PARA RETIRADA! 📦';
      notifMsg = `O pedido ${order.order_number} está embalado e aguardando retirada na Balbec Salgados.`;
    } else if (newStatus === 'RETIRADO') {
      notifTitle = 'Pedido Retirado com Sucesso! ✅';
      notifMsg = `Obrigado por comprar na Balbec Salgados! O pedido ${order.order_number} foi entregue na expedição.`;
    }

    db.createNotification({
      id: `notif-${Date.now()}`,
      franchisee_id: order.franchisee_id,
      title: notifTitle,
      message: notifMsg,
      read: false,
      type: 'ORDER',
      order_id: order.id,
      created_at: nowIso,
    });

    db.createAuditLog({
      id: `aud-${Date.now()}`,
      user_name: adminName,
      user_role: 'admin',
      action: 'ALTERAR_STATUS_PEDIDO',
      target_entity: 'orders',
      target_id: orderId,
      previous_data: `status: ${order.status}`,
      new_data: `status: ${newStatus}`,
      created_at: nowIso,
    });

    return updated;
  }
}

export const orderService = new OrderService();
